const globalCursor = document.createElement("span");
globalCursor.className = "global-cursor-orb";
globalCursor.setAttribute("aria-hidden", "true");
document.body.appendChild(globalCursor);

let cursorVisible = false;
const isTouchDevice = window.matchMedia("(hover: none)").matches;

if (!isTouchDevice) {
  window.addEventListener("pointermove", (event) => {
    if (!cursorVisible) {
      cursorVisible = true;
      globalCursor.classList.add("is-visible");
    }

    globalCursor.style.left = `${event.clientX}px`;
    globalCursor.style.top = `${event.clientY}px`;
  });

  window.addEventListener("pointerleave", () => {
    cursorVisible = false;
    globalCursor.classList.remove("is-visible");
  });
}

// ─────────────────────────────────────────────────────────
// 网易云音乐 — 最近播放 (via NeteaseCloudMusicApi on Vercel)
//
// 部署步骤:
//   1. Fork https://github.com/Binaryify/NeteaseCloudMusicApi
//   2. 在 Vercel 导入该 repo，一键部署（免费）
//   3. 访问 https://your-app.vercel.app/login/cellphone?phone=手机号&password=密码
//      拿到响应里的 cookie 值 (MUSIC_U=...)
//   4. 在 Vercel 项目设置 → Environment Variables 添加 MUSIC_U=<上面的值>
//   5. Redeploy
//   6. 打开 https://your-app.vercel.app/user/account 找到你的 uid
//   7. 把下面的 NETEASE_API 和 NETEASE_UID 替换掉
// ─────────────────────────────────────────────────────────
(function () {
  var NETEASE_API    = "https://api-vercel-init.vercel.app";
  var NETEASE_UID    = "19507482";
  var NETEASE_COOKIE = "MUSIC_U=000B0CC9B98BF8E2982215EAEEDB0FD69CFFDAE9164246E684FC10EC70D6B3CA88EFD109DBD64296D3AF52F4E77035336D7E7AC1CE4EC2ADCAED4767ED60FC2FFE8FAD16135BBE8227F6892E6CE57204F9E8BEB48D27B862B98B770C99C5AADC21BD8A3EF8B03800BB92F29521C24B29D18CC0568F9FC850DD5EF908EC6930B45047767E97C4567DE0AC408C08E94A6D28F4F2C365886AAB15C9C94D35EBEF691A2761DCDABDD90590BC9AD475812424FF28722BF65392A518C04459D3477D78D25F4AD1BE4A306F8F481521DE20FE5D98F3866633922E0A33958F6723FAE9BCAEE5E546CA6CF64AFFA294515D5F7B30A8F36CAFB664C88EC0446A2EF8F0941A6A25FFD8815DB3AF83E3BC503C0DC520B6934B36F9FC5D857412902A7C02299F05ED143D2BA1E2F1F4DD65768C8E49C03CCD9E9AE3F2BA787078ED653989CFC70D9EFBD5309EEA0D88869A1FF8D9D96DBEA21C4FB3475648CC809C346078A2538C230A108D40E71A138AD64679E87E47E2AE84F25E122D8679C8C544F02964B3ED38EE01CA8D32B95B74194622198B1071"; // expires Nov 2026

  if (NETEASE_API.indexOf("YOUR-APP") !== -1) return;

  var widget = document.querySelector("[data-music-widget]");
  if (!widget) return;

  var artEl    = widget.querySelector("[data-music-art]");
  var titleEl  = widget.querySelector("[data-music-title]");
  var artistEl = widget.querySelector("[data-music-artist]");
  var listEl   = widget.querySelector("[data-music-track-list]");

  // ── Mini player ──────────────────────────────────────────
  var audioEl   = new Audio();
  var activeId  = null;

  var playerBar = document.createElement("div");
  playerBar.className = "music-player-bar";
  playerBar.innerHTML =
    '<button class="mpb-toggle" aria-label="Pause">⏸</button>' +
    '<div class="mpb-info">' +
      '<span class="mpb-name"></span>' +
      '<div class="mpb-track"><div class="mpb-fill"></div></div>' +
    '</div>' +
    '<button class="mpb-close" aria-label="Stop">✕</button>';
  widget.appendChild(playerBar);

  playerBar.querySelector(".mpb-toggle").addEventListener("click", function () {
    if (audioEl.paused) {
      audioEl.play(); this.textContent = "⏸";
      if (artEl) artEl.classList.add("is-spinning");
    } else {
      audioEl.pause(); this.textContent = "▶";
      if (artEl) artEl.classList.remove("is-spinning");
    }
  });
  playerBar.querySelector(".mpb-close").addEventListener("click", function () {
    audioEl.pause(); audioEl.src = ""; activeId = null;
    playerBar.classList.remove("is-visible");
    widget.querySelectorAll(".mpb-play-btn").forEach(function (b) { b.textContent = "▶"; b.classList.remove("active"); });
    var cardFill = widget.parentNode.querySelector("[data-card-progress]");
    if (cardFill) cardFill.style.width = "0%";
  });
  audioEl.addEventListener("timeupdate", function () {
    if (!audioEl.duration) return;
    var pct = (audioEl.currentTime / audioEl.duration * 100) + "%";
    playerBar.querySelector(".mpb-fill").style.width = pct;
    var cardFill = widget.parentNode.querySelector("[data-card-progress]");
    if (cardFill) cardFill.style.width = pct;
  });
  audioEl.addEventListener("ended", function () {
    activeId = null; playerBar.classList.remove("is-visible");
    var cardFill = widget.parentNode.querySelector("[data-card-progress]");
    if (cardFill) cardFill.style.width = "0%";
  });

  function playSong(id, name, fallback) {
    if (activeId === id) {
      if (audioEl.paused) { audioEl.play(); playerBar.querySelector(".mpb-toggle").textContent = "⏸"; }
      else                 { audioEl.pause(); playerBar.querySelector(".mpb-toggle").textContent = "▶"; }
      return;
    }
    fetch(NETEASE_API + "/song/url?id=" + id + "&cookie=" + encodeURIComponent(NETEASE_COOKIE))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var url = d.data && d.data[0] && d.data[0].url;
        if (url) {
          activeId = id;
          audioEl.src = url; audioEl.play();
          playerBar.querySelector(".mpb-name").textContent = name;
          playerBar.querySelector(".mpb-fill").style.width = "0%";
          playerBar.querySelector(".mpb-toggle").textContent = "⏸";
          playerBar.classList.add("is-visible");
          if (artEl) artEl.classList.add("is-spinning");
          widget.querySelectorAll(".mpb-play-btn").forEach(function (b) {
            var isActive = b.dataset.id == id;
            b.textContent = isActive ? "⏸" : "▶";
            b.classList.toggle("active", isActive);
          });
        } else {
          window.open(fallback, "_blank");
        }
      }).catch(function () { window.open(fallback, "_blank"); });
  }
  // ─────────────────────────────────────────────────────────

  fetch(NETEASE_API + "/user/record?uid=" + NETEASE_UID + "&type=1&cookie=" + encodeURIComponent(NETEASE_COOKIE))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var tracks = (data.weekData || []).slice(0, 5);
      if (!tracks.length) return;

      var top    = tracks[0].song;
      var topUrl = "https://music.163.com/song?id=" + top.id;

      if (artEl && top.al && top.al.picUrl) {
        var img = document.createElement("img");
        img.src = top.al.picUrl + "?param=300y300";
        img.alt = top.name; img.loading = "lazy";
        artEl.appendChild(img);
        artEl.classList.add("has-art");
      }
      if (titleEl) {
        titleEl.textContent = "";
        var titleLink = document.createElement("a");
        titleLink.href = topUrl; titleLink.target = "_blank"; titleLink.rel = "noopener noreferrer";
        titleLink.textContent = top.name;
        titleLink.style.cssText = "color:inherit;text-decoration:none;";
        titleLink.addEventListener("mouseover", function () { this.style.textDecoration = "underline"; });
        titleLink.addEventListener("mouseout",  function () { this.style.textDecoration = "none"; });
        titleEl.appendChild(titleLink);
      }
      if (artistEl) artistEl.textContent = top.ar.map(function (a) { return a.name; }).join(" / ");

      // Play button on featured track
      var featCopy = widget.querySelector(".music-copy");
      if (featCopy) {
        var fpBtn = document.createElement("button");
        fpBtn.className = "mpb-play-btn featured-play-btn";
        fpBtn.dataset.id = top.id;
        fpBtn.textContent = "▶";
        fpBtn.setAttribute("aria-label", "Play " + top.name);
        fpBtn.addEventListener("click", function () { playSong(top.id, top.name, topUrl); });
        featCopy.appendChild(fpBtn);
      }

      if (listEl) {
        listEl.innerHTML = tracks.slice(1).map(function (item, i) {
          var s = item.song;
          var num = (i + 2) < 10 ? "0" + (i + 2) : String(i + 2);
          var artist = s.ar.map(function (a) { return a.name; }).join(" / ");
          var thumb = s.al && s.al.picUrl ? s.al.picUrl + "?param=80y80" : "";
          return '<li>'
            + '<span class="music-track-num">' + num + "</span>"
            + (thumb ? '<img class="music-track-thumb" src="' + thumb + '" alt="" loading="lazy">' : '<span class="music-track-thumb"></span>')
            + "<span class=\"music-track-info\">"
            + '<span class="music-track-name">' + s.name + "</span>"
            + '<span class="music-track-sub">' + artist + "</span>"
            + "</span>"
            + '<button class="mpb-play-btn" data-id="' + s.id + '" data-name="' + s.name.replace(/"/g,"&quot;") + '" data-href="https://music.163.com/song?id=' + s.id + '" aria-label="Play">▶</button>'
            + "</li>";
        }).join("");
        listEl.querySelectorAll(".mpb-play-btn").forEach(function (btn) {
          btn.addEventListener("click", function () {
            playSong(+this.dataset.id, this.dataset.name, this.dataset.href);
          });
        });
      }
    })
    .catch(function () {});
})();

// The Guardian Sport — dual-proxy with 4 s timeout
(function () {
  var grid = document.querySelector("[data-reading-grid]");
  if (!grid) return;

  var RSS = "https://www.theguardian.com/sport/rss";
  var done = false;

  function render(xml) {
    if (done) return;
    done = true;
    var doc = new DOMParser().parseFromString(xml, "text/xml");
    var items = Array.from(doc.querySelectorAll("item")).slice(0, 3);
    if (!items.length) { grid.innerHTML = ""; return; }

    grid.innerHTML = items.map(function (item) {
      var title   = (item.querySelector("title")    || {}).textContent || "";
      var href    = (item.querySelector("link")     || {}).textContent || "";
      if (!href)   href = (item.querySelector("guid") || {}).textContent || "#";
      var section = (item.querySelector("category") || {}).textContent || "Sport";
      // Pick the largest media:content by width attribute
      var mediaAll = Array.from(item.getElementsByTagNameNS("http://search.yahoo.com/mrss/", "content"));
      if (!mediaAll.length) mediaAll = Array.from(item.getElementsByTagNameNS("*", "content"));
      mediaAll.sort(function (a, b) {
        return parseInt(b.getAttribute("width") || "0", 10) - parseInt(a.getAttribute("width") || "0", 10);
      });
      var imgUrl = mediaAll.length ? (mediaAll[0].getAttribute("url") || "") : "";

      return '<a class="reading-article" href="' + href + '" target="_blank" rel="noopener noreferrer">'
        + (imgUrl ? '<img class="reading-article-img" src="' + imgUrl + '" alt="" loading="lazy">' : "")
        + '<span class="reading-section">' + section + "</span>"
        + '<span class="reading-article-title">' + title + "</span>"
        + "</a>";
    }).join("");
  }

  // Timeout — clear loading state after 4 s if nothing came back
  var timeout = setTimeout(function () {
    if (!done) { done = true; grid.innerHTML = ""; }
  }, 4000);

  // Primary: codetabs proxy (raw text, confirmed working)
  fetch("https://api.codetabs.com/v1/proxy?quest=" + RSS)
    .then(function (r) { if (!r.ok) throw 0; return r.text(); })
    .then(function (t) { clearTimeout(timeout); render(t); })
    .catch(function () {
      // Fallback 1: corsproxy.io
      fetch("https://corsproxy.io/?" + encodeURIComponent(RSS))
        .then(function (r) { if (!r.ok) throw 0; return r.text(); })
        .then(function (t) { clearTimeout(timeout); render(t); })
        .catch(function () {
          // Fallback 2: allorigins.win (JSON-wrapped)
          fetch("https://api.allorigins.win/get?url=" + encodeURIComponent(RSS))
            .then(function (r) { return r.json(); })
            .then(function (d) { clearTimeout(timeout); render(d.contents || ""); })
            .catch(function () { if (!done) { done = true; grid.innerHTML = ""; } });
        });
    });
})();

// Travel map — Leaflet with Seoul + Tokyo markers
(function () {
  var el = document.getElementById("travel-map");
  if (!el || typeof L === "undefined") return;

  var map = L.map(el, {
    center: [37.0, 133.5],
    zoom: 4,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map);

  function pin(name, coords) {
    return L.divIcon({
      className: "",
      html: '<div class="travel-map-pin">'
          + '<div class="travel-map-pin-dot"></div>'
          + '<div class="travel-map-pin-label">'
          + '<strong>' + name + '</strong>'
          + '<span>' + coords + '</span>'
          + '</div>'
          + '</div>',
      iconSize: [155, 50],
      iconAnchor: [77, 7]
    });
  }

  L.marker([37.5759, 126.9769], { icon: pin("Gyeongbokgung Palace", "37.579°N · 126.977°E") }).addTo(map);
  L.marker([35.6594, 139.7006], { icon: pin("Shibuya Crossing", "35.660°N · 139.700°E") }).addTo(map);
})();

// Podcast: fetch featured artwork from iTunes Search API
(function () {
  var widget = document.querySelector("[data-podcast-widget]");
  if (!widget) return;

  var artEl  = widget.querySelector("[data-podcast-featured-art]");
  var nameEl = widget.querySelector("[data-podcast-featured-name]");
  var pubEl  = widget.querySelector("[data-podcast-featured-publisher]");

  fetch(
    "https://itunes.apple.com/search?term=" +
      encodeURIComponent("The Athletic Football Tactics Podcast") +
      "&media=podcast&limit=1"
  )
    .then(function (r) { return r.json(); })
    .then(function (json) {
      var pod = json.results && json.results[0];
      if (!pod) return;
      if (artEl) {
        var img = document.createElement("img");
        img.src = pod.artworkUrl600;
        img.alt = pod.trackName;
        img.loading = "lazy";
        artEl.innerHTML = "";
        artEl.appendChild(img);
        artEl.classList.add("has-image");
      }
      if (nameEl) nameEl.textContent = pod.trackName;
      if (pubEl) pubEl.textContent = pod.artistName;
    })
    .catch(function () {});
})();

// Scroll-triggered card entry animation
(function () {
  const grid = document.querySelector(".notes-grid");
  if (!grid) return;

  // Hide instantly (no transition) before observer fires
  grid.classList.add("cards-hidden");

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();

      // Remove hidden and add entering in the same frame.
      // animation-fill-mode:both keeps cards at "from" during delay,
      // so there's always a hidden starting point to animate from.
      grid.classList.remove("cards-hidden");
      grid.classList.add("cards-entering");

      // Clean up after last card finishes: 260ms delay + 620ms anim + buffer
      setTimeout(() => grid.classList.remove("cards-entering"), 950);
    },
    { threshold: 0.12 }
  );

  observer.observe(grid);
})();

// Typewriter effect for "Right Now." heading — loops forever
(function () {
  var el = document.querySelector(".rightnow-heading");
  if (!el) return;

  var full = el.textContent.trim();
  el.textContent = "";

  var textNode = document.createTextNode("");
  var cursor = document.createElement("span");
  cursor.className = "type-cursor";
  el.appendChild(textNode);
  el.appendChild(cursor);

  function type(i) {
    if (i < full.length) {
      textNode.nodeValue = full.slice(0, i + 1);
      setTimeout(function () { type(i + 1); }, 75);
    } else {
      setTimeout(erase, 1800);
    }
  }

  function erase() {
    var len = full.length;
    function del() {
      if (len > 0) {
        textNode.nodeValue = full.slice(0, --len);
        setTimeout(del, 45);
      } else {
        setTimeout(function () { type(0); }, 500);
      }
    }
    del();
  }

  setTimeout(function () { type(0); }, 300);
})();

// Bowen's Picks -- interactive sports take section
(function () {
  var arena = document.querySelector("[data-picks-arena]");
  if (!arena) return;

  var takes = [
    {
      sport: "NBA",
      sportAttr: "nba",
      statement: "Nikola Jokic is the most complete offensive player in NBA history. The traditional box score still can't fully capture what he does.",
      reasoning: "Look past the 24.5 points. His 65.6% True Shooting is top 1% for any high-usage player in league history. His 2021-23 three-year VORP is the highest recorded stretch ever. A center averaging 10+ assists per game while leading the league in efficiency isn't just rare -- it's never happened before.",
      stats: [
        { value: "65.6%", label: "True Shooting", context: "2022-23 season" },
        { value: "9.2",   label: "VORP",          context: "league best" },
        { value: "10.6",  label: "AST / game",    context: "from center position" }
      ]
    },
    {
      sport: "Premier League",
      sportAttr: "pl",
      statement: "Erling Haaland's 2022-23 Premier League season broke records that the xG model said weren't achievable.",
      reasoning: "His expected goals (xG) for the season was 26.5. He scored 36. That's a +9.5 overperformance -- converting at 26.4% per shot when the elite striker average sits at 10-14%. The model built to predict goals literally couldn't predict him. That's not a hot streak. That's a statistical anomaly.",
      stats: [
        { value: "36",   label: "Goals",          context: "35 PL games" },
        { value: "26.5", label: "xG (expected)",   context: "2022-23" },
        { value: "+9.5", label: "Overperformance", context: "goals above model" }
      ]
    },
    {
      sport: "Formula 1",
      sportAttr: "f1",
      statement: "Verstappen's 2023 season is the most statistically dominant single season in the history of modern motorsport.",
      reasoning: "19 wins from 22 races -- an 86.4% win rate. Schumacher's legendary 2004 was 72.2%. Senna's 1988 was 50%. In a sport with 20 cars and variable conditions, winning 86% of races isn't just dominant -- it's historically unprecedented in the turbo-hybrid era. The gap to P2 at season end was 290 points.",
      stats: [
        { value: "86.4%", label: "Win rate",   context: "19 from 22 races" },
        { value: "290",   label: "Pt gap",     context: "to P2 at season end" },
        { value: "72.2%", label: "Schumacher", context: "2004 comparison" }
      ]
    }
  ];

  var state = { idx: 0, voted: false };

  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  function renderTake() {
    arena.innerHTML = "";
    var take = takes[state.idx];

    var prog = el("div", "picks-progress");
    var n = state.idx + 1;
    prog.textContent = (n < 10 ? "0" + n : n) + " / 0" + takes.length;
    arena.appendChild(prog);

    var badge = el("span", "picks-sport-badge");
    badge.textContent = take.sport;
    badge.dataset.sport = take.sportAttr;
    arena.appendChild(badge);

    var stmt = el("p", "picks-take");
    stmt.textContent = take.statement;
    arena.appendChild(stmt);

    var prompt = el("p", "picks-vote-prompt");
    prompt.textContent = "Agree or disagree?";
    arena.appendChild(prompt);

    var voteRow = el("div", "picks-vote-row");
    ["Agree", "Disagree"].forEach(function (label) {
      var btn = el("button", "picks-vote-btn");
      btn.textContent = label;
      btn.dataset.choice = label.toLowerCase();
      btn.addEventListener("click", function () {
        if (state.voted) return;
        handleVote(label.toLowerCase());
      });
      voteRow.appendChild(btn);
    });
    arena.appendChild(voteRow);
  }

  function handleVote(choice) {
    state.voted = true;

    arena.querySelectorAll(".picks-vote-btn").forEach(function (btn) {
      btn.disabled = true;
      if (btn.dataset.choice === choice) {
        btn.classList.add("voted-" + choice);
      } else {
        btn.classList.add("vote-other");
      }
    });

    arena.appendChild(buildReveal());
  }

  function buildReveal() {
    var take = takes[state.idx];
    var reveal = el("div", "picks-reveal");

    var reasonLabel = el("p", "picks-reason-label");
    reasonLabel.textContent = "Here's why I think this:";
    reveal.appendChild(reasonLabel);

    var reason = el("p", "picks-reasoning");
    reason.textContent = take.reasoning;
    reveal.appendChild(reason);

    var statsRow = el("div", "picks-stats-row");
    take.stats.forEach(function (s) {
      var chip = el("div", "picks-stat-chip");
      var val = el("span", "stat-chip-value");
      val.textContent = s.value;
      var lbl = el("span", "stat-chip-label");
      lbl.textContent = s.label;
      var ctx = el("span", "stat-chip-context");
      ctx.textContent = s.context;
      chip.appendChild(val);
      chip.appendChild(lbl);
      chip.appendChild(ctx);
      statsRow.appendChild(chip);
    });
    reveal.appendChild(statsRow);

    var isLast = state.idx === takes.length - 1;
    var navBtn = el("button", "picks-nav-btn");
    navBtn.textContent = isLast ? "See Summary →" : "Next Take →";
    navBtn.addEventListener("click", function () {
      if (isLast) {
        showEnd();
      } else {
        state.idx++;
        state.voted = false;
        renderTake();
      }
    });
    reveal.appendChild(navBtn);

    return reveal;
  }

  function showEnd() {
    arena.innerHTML = "";
    var end = el("div", "picks-end");

    var h = el("h3", "picks-end-heading");
    h.textContent = "That's how I read the data.";
    end.appendChild(h);

    var sub = el("p", "picks-end-sub");
    sub.textContent = "These are the questions I build tools around. If this kind of analysis interests you, here's where I apply it:";
    end.appendChild(sub);

    var links = el("div", "picks-end-links");

    var link1 = document.createElement("a");
    link1.href = "http://draftshoot.duckdns.org:8501/";
    link1.target = "_blank";
    link1.rel = "noopener noreferrer";
    link1.className = "picks-cta-btn";
    link1.textContent = "Draft Shooting Portal";
    links.appendChild(link1);

    var link2 = document.createElement("a");
    link2.href = "https://bowenlizh.shinyapps.io/04_pd_analyst_dashboard/";
    link2.target = "_blank";
    link2.rel = "noopener noreferrer";
    link2.className = "picks-cta-secondary";
    link2.textContent = "Player Dev Dashboard →";
    links.appendChild(link2);

    end.appendChild(links);

    var replay = el("button", "picks-replay");
    replay.textContent = "Read again";
    replay.addEventListener("click", function () {
      state = { idx: 0, voted: false };
      renderTake();
    });
    end.appendChild(replay);

    arena.appendChild(end);
  }

  renderTake();
})();

