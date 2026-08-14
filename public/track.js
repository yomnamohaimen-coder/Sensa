(function () {
  "use strict";

  try {
    var scriptEl = document.currentScript;
    if (!scriptEl) {
      return;
    }

    var trackingId = scriptEl.getAttribute("data-tracking-id");
    if (!trackingId) {
      return;
    }

    var endpoint = resolveEndpoint(scriptEl.src, "/api/track");
    var snapshotEndpoint = resolveEndpoint(scriptEl.src, "/api/snapshot");
    var recordingEndpoint = resolveEndpoint(
      scriptEl.src,
      "/api/session-recording",
    );
    // Same origin as track.js so host-site CSP that allows Sensa still works.
    var html2canvasSrc = resolveEndpoint(scriptEl.src, "/html2canvas.min.js");
    var rrwebRecordSrc = resolveEndpoint(scriptEl.src, "/rrweb-record.umd.cjs");
    if (!endpoint) {
      return;
    }

    var SESSION_KEY = "sensa_sid";
    // Only written after a successful /api/snapshot response.
    var SNAPSHOT_KEY_PREFIX = "sensa_snap_ok:";
    var SNAPSHOT_SETTLE_MS = 1000;
    var JPEG_QUALITY = 0.72;
    var HTML2CANVAS_TIMEOUT_MS = 12000;
    var IMAGE_TIMEOUT_MS = 1500;
    var TOBLOB_TIMEOUT_MS = 4000;
    var MAX_CANVAS_EDGE = 4096;
    var MAX_CANVAS_AREA = 12 * 1024 * 1024;
    var captureInFlight = false;
    var RRWEB_FLUSH_MS = 10000;
    var RRWEB_FLUSH_COUNT = 50;
    var rrwebBuffer = [];
    var rrwebFlushTimer = null;
    var rrwebStop = null;

    function resolveEndpoint(scriptSrc, apiPath) {
      if (!scriptSrc) {
        return null;
      }

      try {
        var url = new URL(scriptSrc, window.location.href);
        url.pathname = url.pathname.replace(/\/track\.js$/i, apiPath);
        url.search = "";
        url.hash = "";
        return url.toString();
      } catch (error) {
        return null;
      }
    }

    function getSessionId() {
      try {
        var existing = sessionStorage.getItem(SESSION_KEY);
        if (existing) {
          return existing;
        }

        var id =
          (window.crypto &&
            typeof window.crypto.randomUUID === "function" &&
            window.crypto.randomUUID()) ||
          "sess_" +
            Math.random().toString(36).slice(2) +
            Date.now().toString(36);

        sessionStorage.setItem(SESSION_KEY, id);
        return id;
      } catch (error) {
        return (
          "sess_" +
          Math.random().toString(36).slice(2) +
          Date.now().toString(36)
        );
      }
    }

    function getDevice() {
      var width = window.innerWidth || 0;
      if (width > 0 && width < 768) {
        return "mobile";
      }
      if (width >= 768 && width < 1024) {
        return "tablet";
      }
      return "desktop";
    }

    function getPage() {
      return window.location.pathname + window.location.search;
    }

    function clickLabel(el) {
      if (!el || !el.tagName) {
        return "";
      }

      var tag = el.tagName.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (el.type === "password") {
          return "";
        }
        return String(
          el.getAttribute("name") ||
            el.getAttribute("aria-label") ||
            el.getAttribute("placeholder") ||
            el.type ||
            "",
        ).slice(0, 100);
      }

      var text = String(el.innerText || el.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      return text.slice(0, 100);
    }

    function send(eventType, metadata) {
      var body = {
        tracking_id: trackingId,
        session_id: getSessionId(),
        event_type: eventType,
        timestamp: new Date().toISOString(),
        page: getPage(),
        device: getDevice(),
        metadata: metadata || null,
      };

      try {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          keepalive: true,
          mode: "cors",
          credentials: "omit",
        }).catch(function () {});
      } catch (error) {
        // Fail silently — never break the host page.
      }
    }

    function track(eventType, metadata) {
      try {
        if (typeof eventType !== "string" || !eventType.trim()) {
          return;
        }

        if (
          metadata !== undefined &&
          metadata !== null &&
          (typeof metadata !== "object" || Array.isArray(metadata))
        ) {
          return;
        }

        send(eventType.trim(), metadata == null ? null : metadata);
      } catch (error) {
        // Fail silently.
      }
    }

    function clearLegacySnapshotMarks() {
      try {
        var keysToRemove = [];
        for (var i = 0; i < sessionStorage.length; i++) {
          var key = sessionStorage.key(i);
          if (key && key.indexOf("sensa_snap:") === 0) {
            keysToRemove.push(key);
          }
        }
        for (var j = 0; j < keysToRemove.length; j++) {
          sessionStorage.removeItem(keysToRemove[j]);
        }
      } catch (error) {
        // Fail silently.
      }
    }

    function hasCapturedPage(page) {
      try {
        return sessionStorage.getItem(SNAPSHOT_KEY_PREFIX + page) === "1";
      } catch (error) {
        return false;
      }
    }

    function markCapturedPage(page) {
      try {
        sessionStorage.setItem(SNAPSHOT_KEY_PREFIX + page, "1");
      } catch (error) {
        // Fail silently.
      }
    }

    /**
     * Strip media/backgrounds from the html2canvas clone so rendering cannot
     * hang on CORS / never-loading remote assets (common on listing pages).
     */
    function sanitizeClone(clonedDoc) {
      try {
        var root = clonedDoc.documentElement || clonedDoc.body;
        if (!root) {
          return;
        }

        var media = root.querySelectorAll(
          "img, source, video, iframe, object, embed",
        );
        for (var i = 0; i < media.length; i++) {
          var el = media[i];
          var tag = String(el.tagName || "").toUpperCase();
          if (
            tag === "IFRAME" ||
            tag === "VIDEO" ||
            tag === "OBJECT" ||
            tag === "EMBED"
          ) {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
            continue;
          }
          try {
            el.removeAttribute("src");
            el.removeAttribute("srcset");
            el.removeAttribute("crossorigin");
            el.style.background = "#d4d4d8";
          } catch (error) {
            // Continue sanitizing.
          }
        }

        var all = root.querySelectorAll("*");
        for (var j = 0; j < all.length; j++) {
          var node = all[j];
          try {
            // Clear class-based and inline background images (listing heroes, etc.).
            node.style.setProperty("background-image", "none", "important");
          } catch (error) {
            // Continue sanitizing.
          }
        }
      } catch (error) {
        // Fail silently — capture may still succeed.
      }
    }

    function computeScale(target) {
      var width = Math.max(
        target.scrollWidth || 0,
        target.clientWidth || 0,
        document.documentElement ? document.documentElement.clientWidth : 0,
        1,
      );
      var height = Math.max(
        target.scrollHeight || 0,
        target.clientHeight || 0,
        1,
      );
      var scale = Math.min(
        1,
        MAX_CANVAS_EDGE / width,
        MAX_CANVAS_EDGE / height,
        Math.sqrt(MAX_CANVAS_AREA / (width * height)),
      );
      if (!isFinite(scale) || scale <= 0) {
        return 1;
      }
      return scale;
    }

    function loadHtml2Canvas(callback) {
      try {
        if (!html2canvasSrc) {
          return;
        }

        var called = false;
        function done(fn) {
          if (called || typeof fn !== "function") {
            return;
          }
          called = true;
          callback(fn);
        }

        if (typeof window.html2canvas === "function") {
          done(window.html2canvas);
          return;
        }

        var existing = document.querySelector(
          'script[data-sensa-html2canvas="1"]',
        );
        if (!existing) {
          var script = document.createElement("script");
          script.async = true;
          script.setAttribute("data-sensa-html2canvas", "1");
          // Attach handlers before src to avoid missing cached load events.
          script.onload = function () {
            done(window.html2canvas);
          };
          script.onerror = function () {};
          script.src = html2canvasSrc;
          (document.head || document.documentElement).appendChild(script);
        } else {
          existing.addEventListener("load", function () {
            done(window.html2canvas);
          });
        }

        // Polling fallback if load already fired before listeners attached.
        var polls = 0;
        var pollId = setInterval(function () {
          polls += 1;
          if (typeof window.html2canvas === "function") {
            clearInterval(pollId);
            done(window.html2canvas);
          } else if (polls >= 100) {
            clearInterval(pollId);
          }
        }, 50);
      } catch (error) {
        // Fail silently.
      }
    }

    function dataUrlToBlob(canvas) {
      var dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      var parts = dataUrl.split(",");
      var mimeMatch = parts[0] && parts[0].match(/:(.*?);/);
      var mime = (mimeMatch && mimeMatch[1]) || "image/jpeg";
      var binary = atob(parts[1] || "");
      var len = binary.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    }

    function canvasToJpegBlob(canvas, callback) {
      var settled = false;
      function finish(blob) {
        if (settled) {
          return;
        }
        settled = true;
        callback(blob || null);
      }

      var timer = setTimeout(function () {
        try {
          finish(dataUrlToBlob(canvas));
        } catch (error) {
          finish(null);
        }
      }, TOBLOB_TIMEOUT_MS);

      try {
        if (typeof canvas.toBlob === "function") {
          canvas.toBlob(
            function (blob) {
              clearTimeout(timer);
              if (blob) {
                finish(blob);
                return;
              }
              try {
                finish(dataUrlToBlob(canvas));
              } catch (error) {
                finish(null);
              }
            },
            "image/jpeg",
            JPEG_QUALITY,
          );
          return;
        }
        clearTimeout(timer);
        finish(dataUrlToBlob(canvas));
      } catch (error) {
        clearTimeout(timer);
        try {
          finish(dataUrlToBlob(canvas));
        } catch (fallbackError) {
          finish(null);
        }
      }
    }

    function uploadSnapshot(page, blob, width, height) {
      if (!snapshotEndpoint || !blob) {
        return;
      }

      try {
        var form = new FormData();
        form.append("tracking_id", trackingId);
        form.append("page", page);
        form.append("image", blob, "snapshot.jpg");
        form.append("width", String(width));
        form.append("height", String(height));

        fetch(snapshotEndpoint, {
          method: "POST",
          body: form,
          mode: "cors",
          credentials: "omit",
        })
          .then(function (response) {
            if (response && response.ok) {
              markCapturedPage(page);
            }
          })
          .catch(function () {});
      } catch (error) {
        // Fail silently.
      }
    }

    function runHtml2Canvas(html2canvas, target) {
      var scale = computeScale(target);
      var render = html2canvas(target, {
        logging: false,
        // Do not attempt CORS image loads — sanitizeClone removes remote media.
        // allowTaint:false keeps the canvas exportable via toBlob/toDataURL.
        useCORS: false,
        allowTaint: false,
        imageTimeout: IMAGE_TIMEOUT_MS,
        scale: scale,
        removeContainer: true,
        onclone: function (clonedDoc) {
          sanitizeClone(clonedDoc);
        },
        ignoreElements: function (el) {
          if (!el || !el.tagName) {
            return false;
          }
          var tag = String(el.tagName).toUpperCase();
          return (
            tag === "IFRAME" ||
            tag === "VIDEO" ||
            tag === "OBJECT" ||
            tag === "EMBED" ||
            tag === "SCRIPT" ||
            tag === "NOSCRIPT"
          );
        },
      });

      if (!render || typeof render.then !== "function") {
        return Promise.reject(new Error("html2canvas did not return a promise"));
      }

      return new Promise(function (resolve, reject) {
        var settled = false;
        var timer = setTimeout(function () {
          if (!settled) {
            settled = true;
            reject(new Error("html2canvas timed out"));
          }
        }, HTML2CANVAS_TIMEOUT_MS);

        render.then(
          function (canvas) {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timer);
            resolve(canvas);
          },
          function (error) {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timer);
            reject(error);
          },
        );
      });
    }

    function capturePageSnapshot() {
      try {
        if (!snapshotEndpoint || !html2canvasSrc || captureInFlight) {
          return;
        }

        var page = getPage();
        if (hasCapturedPage(page)) {
          return;
        }

        captureInFlight = true;

        loadHtml2Canvas(function (html2canvas) {
          try {
            var target = document.body || document.documentElement;
            if (!target || typeof html2canvas !== "function") {
              captureInFlight = false;
              return;
            }

            runHtml2Canvas(html2canvas, target)
              .then(function (canvas) {
                try {
                  if (!canvas || !canvas.width || !canvas.height) {
                    captureInFlight = false;
                    return;
                  }

                  canvasToJpegBlob(canvas, function (blob) {
                    captureInFlight = false;
                    if (!blob) {
                      return;
                    }
                    uploadSnapshot(page, blob, canvas.width, canvas.height);
                  });
                } catch (error) {
                  captureInFlight = false;
                }
              })
              .catch(function () {
                captureInFlight = false;
              });
          } catch (error) {
            captureInFlight = false;
          }
        });
      } catch (error) {
        captureInFlight = false;
      }
    }

    function getRrwebRecordFn() {
      if (window.rrweb && typeof window.rrweb.record === "function") {
        return window.rrweb.record;
      }
      if (typeof window.rrwebRecord === "function") {
        return window.rrwebRecord;
      }
      if (window.rrwebRecord && typeof window.rrwebRecord.record === "function") {
        return window.rrwebRecord.record;
      }
      return null;
    }

    function flushRrwebBuffer() {
      try {
        if (rrwebBuffer.length === 0 || !recordingEndpoint) {
          return;
        }

        var batch = rrwebBuffer.splice(0, rrwebBuffer.length);

        fetch(recordingEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tracking_id: trackingId,
            session_id: getSessionId(),
            page: getPage(),
            rrweb_events: batch,
          }),
          keepalive: true,
          mode: "cors",
          credentials: "omit",
        }).catch(function () {});
      } catch (error) {
        // Fail silently — never break the host page.
      }
    }

    function queueRrwebEvent(event) {
      try {
        rrwebBuffer.push(event);
        if (rrwebBuffer.length >= RRWEB_FLUSH_COUNT) {
          flushRrwebBuffer();
        }
      } catch (error) {
        // Fail silently.
      }
    }

    function loadRrwebRecord(callback) {
      try {
        if (!rrwebRecordSrc) {
          return;
        }

        var called = false;
        function done(fn) {
          if (called || typeof fn !== "function") {
            return;
          }
          called = true;
          callback(fn);
        }

        var existingFn = getRrwebRecordFn();
        if (existingFn) {
          done(existingFn);
          return;
        }

        var existing = document.querySelector('script[data-sensa-rrweb="1"]');
        if (!existing) {
          var script = document.createElement("script");
          script.async = true;
          script.setAttribute("data-sensa-rrweb", "1");
          script.onload = function () {
            done(getRrwebRecordFn());
          };
          script.onerror = function () {};
          script.src = rrwebRecordSrc;
          (document.head || document.documentElement).appendChild(script);
        } else {
          existing.addEventListener("load", function () {
            done(getRrwebRecordFn());
          });
        }

        var polls = 0;
        var pollId = setInterval(function () {
          polls += 1;
          var fn = getRrwebRecordFn();
          if (fn) {
            clearInterval(pollId);
            done(fn);
          } else if (polls >= 100) {
            clearInterval(pollId);
          }
        }, 50);
      } catch (error) {
        // Fail silently.
      }
    }

    function startSessionRecording() {
      try {
        loadRrwebRecord(function (record) {
          try {
            if (typeof record !== "function" || rrwebStop) {
              return;
            }

            rrwebStop = record({
              emit: function (event) {
                queueRrwebEvent(event);
              },
            });

            if (!rrwebFlushTimer) {
              rrwebFlushTimer = setInterval(flushRrwebBuffer, RRWEB_FLUSH_MS);
            }

            document.addEventListener("visibilitychange", function () {
              if (document.visibilityState === "hidden") {
                flushRrwebBuffer();
              }
            });
            window.addEventListener("pagehide", flushRrwebBuffer);
          } catch (error) {
            // Fail silently.
          }
        });
      } catch (error) {
        // Fail silently.
      }
    }

    function schedulePageSnapshot() {
      try {
        function run() {
          setTimeout(capturePageSnapshot, SNAPSHOT_SETTLE_MS);
        }

        if (document.readyState === "complete") {
          run();
        } else {
          window.addEventListener("load", run);
        }
      } catch (error) {
        // Fail silently.
      }
    }

    try {
      window.sensa = window.sensa || {};
      window.sensa.track = track;
    } catch (error) {
      // Fail silently if window is not writable.
    }

    clearLegacySnapshotMarks();

    send("page_view", {
      title: document.title || null,
      referrer: document.referrer || null,
    });

    document.addEventListener(
      "click",
      function (event) {
        try {
          var target = event.target;
          if (!target) {
            return;
          }

          if (target.nodeType === 3 && target.parentElement) {
            target = target.parentElement;
          }

          if (!target.tagName) {
            return;
          }

          send("click", {
            x: typeof event.pageX === "number" ? event.pageX : null,
            y: typeof event.pageY === "number" ? event.pageY : null,
            viewportWidth: window.innerWidth || null,
            viewportHeight: window.innerHeight || null,
            tag: String(target.tagName).toLowerCase(),
            id: target.id || null,
            text: clickLabel(target) || null,
            alt: (function () {
              if (String(target.tagName).toLowerCase() !== "img") {
                return null;
              }
              var altAttr = target.getAttribute("alt");
              if (!altAttr) {
                return null;
              }
              var trimmed = String(altAttr).replace(/\s+/g, " ").trim();
              return trimmed ? trimmed.slice(0, 100) : null;
            })(),
          });
        } catch (error) {
          // Fail silently.
        }
      },
      true,
    );

    schedulePageSnapshot();
    startSessionRecording();
  } catch (error) {
    // Fail silently.
  }
})();
