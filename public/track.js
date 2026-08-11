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

    var endpoint = resolveEndpoint(scriptEl.src);
    if (!endpoint) {
      return;
    }

    var SESSION_KEY = "sensa_sid";

    function resolveEndpoint(scriptSrc) {
      if (!scriptSrc) {
        return null;
      }

      try {
        var url = new URL(scriptSrc, window.location.href);
        url.pathname = url.pathname.replace(/\/track\.js$/i, "/api/track");
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

    try {
      window.sensa = window.sensa || {};
      window.sensa.track = track;
    } catch (error) {
      // Fail silently if window is not writable.
    }

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

          // Prefer the nearest element node if a text node was clicked.
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
          });
        } catch (error) {
          // Fail silently.
        }
      },
      true,
    );
  } catch (error) {
    // Fail silently.
  }
})();
