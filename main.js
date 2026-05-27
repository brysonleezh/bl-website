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
      var tracks = (data.weekData || []).slice(0, 7);
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

// News: ESPN Sports (left) + NYT Most Popular 7-day (right)
(function () {
  var sportsEl = document.querySelector("[data-nyt-articles]");
  var popularEl = document.querySelector("[data-nyt-popular]");
  if (!sportsEl && !popularEl) return;

  var NYT_KEY = "IJy4niBYdnqyR0wlvMYb74T1UaA0VqptOpxOJ6wzetQ2uCA0";

  function renderList(el, items) {
    el.innerHTML = "";
    items.slice(0, 3).forEach(function (item) {
      var li = document.createElement("li");
      li.className = "reading-item";

      var tag = document.createElement("span");
      tag.className = "reading-item-tag";
      tag.textContent = item.tag;

      var link = document.createElement("a");
      link.className = "reading-item-title";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.title;

      li.appendChild(tag);
      li.appendChild(link);
      el.appendChild(li);
    });
  }

  // ESPN: one headline each from NBA, Premier League, F1
  if (sportsEl) {
    var espnSources = [
      { tag: "NBA",            url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=1" },
      { tag: "Premier League", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=1" },
      { tag: "F1",             url: "https://site.api.espn.com/apis/site/v2/sports/racing/f1/news?limit=1" }
    ];
    Promise.all(espnSources.map(function (s) {
      return fetch(s.url)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var a = (d.articles || [])[0];
          if (!a) return null;
          return { tag: s.tag, title: a.headline, url: a.links.web.href };
        })
        .catch(function () { return null; });
    })).then(function (results) {
      renderList(sportsEl, results.filter(Boolean));
    });
  }

  // NYT Most Popular — 7-day views
  if (popularEl) {
    fetch("https://api.nytimes.com/svc/mostpopular/v2/viewed/7.json?api-key=" + NYT_KEY)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var items = (d.results || []).slice(0, 3).map(function (a) {
          return { tag: a.section || "NYT", title: a.title, url: a.url };
        });
        renderList(popularEl, items);
      })
      .catch(function () {});
  }
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

// Sport bar — hover popup with ESPN schedule preview
(function () {
  var items = document.querySelectorAll(".sport-item[data-sport]");
  if (!items.length) return;

  var ESPN = "https://site.api.espn.com/apis/site/v2/sports/";
  var DOWS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function escH(s) { return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function fmtPopupDate(iso) {
    var d = new Date(iso);
    return DOWS_SHORT[d.getDay()] + " " + (d.getMonth() + 1) + "/" + d.getDate();
  }

  function fmtPopupTime(iso) {
    var d = new Date(iso);
    var h = d.getHours(), m = d.getMinutes(), ampm = h >= 12 ? "p" : "a";
    h = h % 12 || 12;
    return h + (m ? ":" + (m < 10 ? "0" + m : m) : "") + ampm;
  }

  function renderGames(listEl, events) {
    if (!events.length) {
      listEl.innerHTML = '<li class="sport-popup-none">No upcoming games found</li>';
      return;
    }
    var upcoming = events.filter(function (ev) {
      var state = (ev.competitions[0] && ev.competitions[0].status && ev.competitions[0].status.type.state) || "pre";
      return state === "pre" || state === "in";
    }).slice(0, 4);

    if (!upcoming.length) {
      listEl.innerHTML = '<li class="sport-popup-none">No upcoming games</li>';
      return;
    }

    listEl.innerHTML = upcoming.map(function (ev) {
      var comp = ev.competitions[0] || {};
      var state = (comp.status && comp.status.type.state) || "pre";
      var comps = comp.competitors || [];
      var away = null, home = null;
      for (var i = 0; i < comps.length; i++) {
        if (comps[i].homeAway === "away") away = comps[i];
        else home = comps[i];
      }
      if (!away) away = comps[0] || {};
      if (!home) home = comps[1] || {};
      var aAbbr = (away.team && (away.team.abbreviation || away.team.shortDisplayName)) || "?";
      var hAbbr = (home.team && (home.team.abbreviation || home.team.shortDisplayName)) || "?";

      if (state === "in") {
        var aScore = away.score || "0", hScore = home.score || "0";
        var period = (comp.status && comp.status.type.shortDetail) || "Live";
        return "<li class='sport-popup-game'>" +
          "<span class='popup-game-live-row'><span class='game-live'>LIVE</span><span class='popup-game-period'>" + escH(period) + "</span></span>" +
          "<span class='popup-game-matchup'>" + escH(aAbbr) + " <span class='popup-score'>" + aScore + "–" + hScore + "</span> " + escH(hAbbr) + "</span>" +
        "</li>";
      }

      var dateStr = fmtPopupDate(ev.date);
      var timeStr = fmtPopupTime(ev.date);
      return "<li class='sport-popup-game'>" +
        "<span class='popup-game-date'><span class='popup-date-dow'>" + dateStr.split(" ")[0] + "</span><span class='popup-date-md'>" + dateStr.split(" ")[1] + "</span></span>" +
        "<span class='popup-game-matchup'>" + escH(aAbbr) + " <span class='popup-vs'>@</span> " + escH(hAbbr) + "</span>" +
        "<span class='popup-game-time'>" + timeStr + "</span>" +
      "</li>";
    }).join("");
  }

  [].forEach.call(items, function (item) {
    var sport = item.dataset.sport;
    var listEl = item.querySelector("[data-games]");
    var ctaEl  = item.querySelector(".sport-popup-cta");
    var fetched = false;

    // Wire CTA to sports.html
    if (ctaEl) {
      ctaEl.addEventListener("click", function () {
        window.location.href = "sports.html?sport=" + encodeURIComponent(sport);
      });
    }

    item.addEventListener("mouseenter", function () {
      if (fetched || !listEl) return;
      fetched = true;

      if (sport === "tennis") {
        listEl.innerHTML = "<li class='sport-popup-game'>" +
          "<span class='popup-game-date'><span class='popup-date-dow'>Now</span><span class='popup-date-md'></span></span>" +
          "<span class='popup-game-matchup'>Roland Garros</span>" +
          "<span class='popup-game-time'>Clay</span>" +
        "</li><li class='sport-popup-game'>" +
          "<span class='popup-game-date'><span class='popup-date-dow'>Jun</span><span class='popup-date-md'>29</span></span>" +
          "<span class='popup-game-matchup'>Wimbledon</span>" +
          "<span class='popup-game-time'>Grass</span>" +
        "</li>";
        return;
      }

      fetch(ESPN + sport + "/scoreboard?limit=10")
        .then(function (r) { return r.json(); })
        .then(function (d) { renderGames(listEl, d.events || []); })
        .catch(function () {
          listEl.innerHTML = "<li class='sport-popup-none'>—</li>";
        });
    });

    item.querySelector(".sport-btn").addEventListener("click", function () {
      document.dispatchEvent(new CustomEvent("sport-tab-open", { detail: { sport: sport } }));
    });
  });
})();

// Navigate to sports.html when a sport emoji is clicked on any page
document.addEventListener("sport-tab-open", function (e) {
  window.location.href = "sports.html?sport=" + encodeURIComponent(e.detail.sport);
});

// Sports calendar page
(function () {
  if (!document.querySelector(".sports-page")) return;

  var ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/";

  var WANG_XINYU = [
    { id:"ao2026",    name:"Australian Open",   venue:"Melbourne Park, Melbourne",       start:"2026-01-19", end:"2026-02-01", surface:"Hard",  tier:"Grand Slam", prize:"A$86.5M" },
    { id:"iw2026",    name:"Indian Wells Open", venue:"Indian Wells Tennis Garden, CA",  start:"2026-03-09", end:"2026-03-22", surface:"Hard",  tier:"WTA 1000",   prize:"" },
    { id:"miami2026", name:"Miami Open",        venue:"Hard Rock Stadium, Miami",        start:"2026-03-24", end:"2026-04-05", surface:"Hard",  tier:"WTA 1000",   prize:"" },
    { id:"rg2026",    name:"Roland Garros",     venue:"Stade Roland Garros, Paris",      start:"2026-05-25", end:"2026-06-07", surface:"Clay",  tier:"Grand Slam", prize:"€49.6M" },
    { id:"wim2026",   name:"Wimbledon",         venue:"All England Club, London",        start:"2026-06-29", end:"2026-07-12", surface:"Grass", tier:"Grand Slam", prize:"£50M" },
    { id:"uso2026",   name:"US Open",           venue:"USTA Billie Jean King NTC, NYC",  start:"2026-08-31", end:"2026-09-13", surface:"Hard",  tier:"Grand Slam", prize:"$65M" },
    { id:"wtaf2026",  name:"WTA Finals",        venue:"Shenzhen Bay Sports Center",      start:"2026-11-02", end:"2026-11-09", surface:"Hard",  tier:"WTA Finals", prize:"" },
  ];

  // Priority order: most-watched first
  var SPORTS = [
    { key:"nba",     label:"NBA",     full:"NBA",              emoji:"🏀",  color:"#c9243f", type:"scoreboard", league:"basketball/nba" },
    { key:"f1",      label:"F1",      full:"Formula 1",        emoji:"🏎️", color:"#00594f", type:"scoreboard", league:"racing/f1" },
    { key:"tennis",  label:"Tennis",  full:"Wang Xinyu",       emoji:"🎾",  color:"#c8860a", type:"static" },
    { key:"wc",      label:"WC",      full:"World Cup",        emoji:"🏆",  color:"#1a56db", type:"scoreboard", league:"soccer/fifa.world" },
    { key:"pl",      label:"PL",      full:"Premier League",   emoji:"⚽️", color:"#3d195b", type:"scoreboard", league:"soccer/eng.1" },
    { key:"ucl",     label:"UCL",     full:"Champions League", emoji:"⚽️", color:"#1d47ba", type:"scoreboard", league:"soccer/uefa.champions" },
    { key:"dodgers", label:"Dodgers", full:"LA Dodgers",       emoji:"⚾️", color:"#005a9c", type:"team",       url:ESPN_BASE + "baseball/mlb/teams/19/schedule" },
    { key:"kings",   label:"Kings",   full:"LA Kings",         emoji:"🏒",  color:"#111a3c", type:"team",       url:ESPN_BASE + "hockey/nhl/teams/26/schedule" },
    { key:"ncaa",    label:"NCAA",    full:"NCAA Football",    emoji:"🏈",  color:"#bf5700", type:"scoreboard", league:"football/college-football" },
  ];

  // ESPN headshots only for players whose IDs are confirmed
  var ESPN_HS = "https://a.espncdn.com/combiner/i?img=/i/headshots/";
  var FOLLOWING = [
    {
      key:"alonso", name:"Fernando Alonso", sport:"Formula 1", emoji:"🏎️", bg:"#00594f", fg:"#a6e22e",
      featured:true, badge:"2026 Season", logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/racing/500/astm.png",
      facts:["2× World Champion","Aston Martin AMR25","El Plan 33"],
      note:"Watched him dominate in Ferrari red. Still chasing that 3rd title at Aston Martin.",
      players:[
        { name:"Alonso #14", photo:"assets/following/alonso.jpg" },
        { name:"Stroll #18", photo:"" },
      ],
    },
    {
      key:"lakers", name:"LA Lakers", sport:"NBA", emoji:"🏀", bg:"#552583", fg:"#FDB927",
      featured:true, badge:"Playoffs 🔥", logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/lal.png",
      facts:["17× NBA Champion","Kobe → LeBron era","Crypto.com Arena"],
      note:"Been watching since Kobe's 2010 chip. Still bleed purple and gold.",
      players:[
        { name:"LeBron James",  photo: ESPN_HS + "nba/players/full/1966.png&h=160&w=160" },
        { name:"Anthony Davis", photo: ESPN_HS + "nba/players/full/3202.png&h=160&w=160" },
        { name:"A. Reaves",     photo: ESPN_HS + "nba/players/full/4066457.png&h=160&w=160" },
      ],
    },
    {
      key:"clippers", name:"LA Clippers", sport:"NBA", emoji:"🏀", bg:"#c8102e", fg:"#ffffff",
      featured:true, badge:"Playoffs 🔥", logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/lac.png",
      facts:["James Harden era","Kawhi Leonard","New Intuit Dome"],
      note:"Started watching for James Harden. Intuit Dome is a great arena.",
      players:[
        { name:"James Harden",  photo: ESPN_HS + "nba/players/full/3992.png&h=160&w=160" },
        { name:"Kawhi Leonard", photo: ESPN_HS + "nba/players/full/6450.png&h=160&w=160" },
        { name:"N. Powell",     photo:"" },
      ],
    },
    {
      key:"xinyu", name:"Wang Xinyu", sport:"WTA Tennis", emoji:"🎾", bg:"#c8860a", fg:"#fff4d6",
      featured:true, badge:"Roland Garros 🌸", logo:"",
      facts:["China 🇨🇳","Right-handed","WTA Top 50"],
      note:"Following her rise through the WTA ranks. China's most exciting player.",
      players:[
        { name:"王欣瑜", photo:"assets/following/xinyu.jpg" },
      ],
    },
    {
      key:"wc", name:"World Cup 2026", sport:"Soccer", emoji:"🏆", bg:"#1a56db", fg:"#ffffff",
      banner:true, badge:"Jun 11 · USA", logo:"",
      facts:["48 Teams · USA/Canada/Mexico","June 11 – July 19, 2026","First NA since 1994"],
      note:"First World Cup on US soil since 1994. Can't miss a single match.",
      players:[
        { name:"Mbappé",       photo:"https://img.a.transfermarkt.technology/portrait/medium/342229.jpg" },
        { name:"Haaland",      photo:"https://img.a.transfermarkt.technology/portrait/medium/418560.jpg" },
        { name:"Vinicius Jr.", photo:"https://img.a.transfermarkt.technology/portrait/medium/371998.jpg" },
      ],
    },
    {
      key:"dodgers", name:"LA Dodgers", sport:"MLB", emoji:"⚾️", bg:"#005a9c", fg:"#ef3e42",
      logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/lad.png",
      facts:["2020 & 2024 Champions","Shohei Ohtani","Dodger Stadium"],
      note:"Yamamoto's arm is unreal. Back-to-back champions — this team is special.",
      players:[
        { name:"Shohei Ohtani", photo:"https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/660271/headshot/67/current" },
        { name:"Y. Yamamoto",   photo:"https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/808967/headshot/67/current" },
        { name:"F. Freeman",    photo:"https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/518692/headshot/67/current" },
      ],
    },
    {
      key:"spurs", name:"Tottenham Hotspur", sport:"Premier League", emoji:"⚽️", bg:"#132257", fg:"#ffffff",
      logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/253.png",
      facts:["Son Heung-min fan","1961 Double winners","Spurs Stadium, London"],
      note:"Son Heung-min fan since his breakout season. 손흥민.",
      players:[
        { name:"Son Heung-min", photo:"https://img.a.transfermarkt.technology/portrait/medium/246669.jpg" },
        { name:"J. Maddison",   photo:"https://img.a.transfermarkt.technology/portrait/medium/264655.jpg" },
      ],
    },
    {
      key:"kings", name:"LA Kings", sport:"NHL", emoji:"🏒", bg:"#111a3c", fg:"#a2aaad",
      logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/nhl/500/la.png",
      facts:["2× Stanley Cup","Drew Doughty","Crypto.com Arena"],
      note:"Tune in when the playoffs heat up. LA's other arena team.",
      players:[
        { name:"Drew Doughty", photo:"https://assets.nhle.com/mugs/nhl/1080x1080/8474187.png" },
        { name:"Anze Kopitar", photo:"https://assets.nhle.com/mugs/nhl/1080x1080/8471685.png" },
      ],
    },
    {
      key:"usc", name:"USC Trojans", sport:"NCAA Football", emoji:"🏈", bg:"#990000", fg:"#ffc72c",
      logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/30.png",
      facts:["11× Natl Champions","Fight On!","LA Memorial Coliseum"],
      note:"Local school, big games. Fight On! Watch for the big rivalry matchups.",
      players:[
        { name:"Lincoln Riley HC", photo:"" },
      ],
    },
  ];

  var ESPN_TO_KEY = {
    "soccer/eng.1":"pl",    "soccer/uefa.champions":"ucl",  "soccer/fifa.world":"wc",
    "tennis":"tennis",      "basketball/nba":"nba",
    "football/college-football":"ncaa", "football/nfl":"ncaa",
    "hockey/nhl":"kings",   "racing/f1":"f1",               "baseball/mlb":"dodgers",
  };

  var today      = new Date();
  var rangeStart = new Date(today.getFullYear(), today.getMonth(), 1);
  var rangeEnd   = new Date(today.getFullYear(), today.getMonth() + 6, 0);

  function fmtParam(d) { return "" + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()); }
  var DATE_FROM = fmtParam(rangeStart);
  var DATE_TO   = fmtParam(rangeEnd);

  var allEvents     = [];
  var activeFilters = {};
  SPORTS.forEach(function (s) { activeFilters[s.key] = true; });
  var curYear      = today.getFullYear();
  var curMonth     = today.getMonth();
  var curView      = "month";
  var curWeekStart = getWeekStart(today);
  var selDay       = null;

  function getWeekStart(d) {
    var w = new Date(d);
    w.setHours(0, 0, 0, 0);
    w.setDate(w.getDate() - w.getDay());
    return w;
  }

  function pad2(n)      { return n < 10 ? "0" + n : "" + n; }
  function toDs(d)      { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function escH(s)      { return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function escICS(s)    { return String(s || "").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n"); }
  function findSport(k) { for (var i = 0; i < SPORTS.length; i++) { if (SPORTS[i].key === k) return SPORTS[i]; } return null; }

  var elFilters   = document.querySelector("[data-filter-bar]");
  var elGrid      = document.querySelector("[data-cal-grid]");
  var elLabel     = document.querySelector("[data-month-label]");
  var elDetail    = document.querySelector("[data-cal-detail]");
  var elDetDate   = document.querySelector("[data-detail-date]");
  var elDetEvts   = document.querySelector("[data-detail-events]");
  var elFollowing = document.querySelector("[data-following-grid]");

  var MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var DOWS         = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function renderFilters() {
    if (!elFilters) return;
    elFilters.innerHTML = SPORTS.map(function (s) {
      var active = activeFilters[s.key];
      return "<button class='sport-filter-chip" + (active ? "" : " inactive") + "'" +
             " data-fkey='" + s.key + "' style='--cc:" + s.color + "'>" +
             s.emoji + " " + escH(s.full) + "</button>";
    }).join("");
  }

  function eventsOnDay(ds) {
    var out = [];
    for (var i = 0; i < allEvents.length; i++) {
      var ev = allEvents[i];
      if (!activeFilters[ev.sport]) continue;
      if (ev.allDay) {
        if ((ev.startDate || ev.date) <= ds && ds <= (ev.endDate || ev.date)) out.push(ev);
      } else {
        if (ev.date === ds) out.push(ev);
      }
    }
    return out;
  }

  function renderCal() {
    if (!elGrid) return;
    if (curView === "week") {
      elGrid.className = "cal-grid cal-grid-week";
      renderWeekView();
    } else {
      elGrid.className = "cal-grid cal-grid-month";
      renderMonthCal();
    }
  }

  function renderMonthCal() {
    if (elLabel) elLabel.textContent = MONTHS[curMonth] + " " + curYear;
    var firstDow  = new Date(curYear, curMonth, 1).getDay();
    var daysInMon = new Date(curYear, curMonth + 1, 0).getDate();
    var todayStr  = toDs(today);
    var html = "";

    DOWS.forEach(function (d) { html += "<div class='cal-dow'>" + d + "</div>"; });
    for (var e = 0; e < firstDow; e++) { html += "<div class='cal-day cal-day-other'></div>"; }

    for (var d = 1; d <= daysInMon; d++) {
      var ds = curYear + "-" + pad2(curMonth + 1) + "-" + pad2(d);
      var dayEvs = eventsOnDay(ds);

      var allDayEvs = [], timedEvs = [];
      for (var i = 0; i < dayEvs.length; i++) {
        if (dayEvs[i].allDay) allDayEvs.push(dayEvs[i]);
        else timedEvs.push(dayEvs[i]);
      }
      var sorted = allDayEvs.concat(timedEvs);

      var chipsHtml = "";
      for (var i = 0; i < sorted.length && i < 2; i++) {
        var ev = sorted[i];
        var sp = findSport(ev.sport);
        var col = sp ? sp.color : "#20242a";
        if (ev.allDay) {
          chipsHtml += "<span class='cal-chip cal-chip-allday' style='--chip-bg:" + col + "'>" + escH(ev.name.split(" ")[0]) + "</span>";
        } else {
          var lbl = (ev.teams || ev.name || "").substring(0, 11);
          chipsHtml += "<span class='cal-chip' style='--chip-bg:" + col + "'>" + escH(lbl) + "</span>";
        }
      }
      if (sorted.length > 2) {
        chipsHtml += "<span class='cal-chip cal-chip-more'>+" + (sorted.length - 2) + "</span>";
      }

      var dotsHtml = "";
      var seen = {};
      for (var i = 0; i < dayEvs.length; i++) {
        var k = dayEvs[i].sport;
        if (seen[k]) continue;
        seen[k] = true;
        var sp = findSport(k);
        if (sp) dotsHtml += "<span class='cal-dot' style='background:" + sp.color + "'></span>";
      }

      html += "<div class='cal-day" +
        (ds === todayStr ? " cal-today" : "") +
        (ds === selDay   ? " cal-selected" : "") +
        "' data-date='" + ds + "'>" +
        "<span class='cal-day-num'>" + d + "</span>" +
        (chipsHtml ? "<div class='cal-chips'>" + chipsHtml + "</div>" : "") +
        (dotsHtml  ? "<div class='cal-dots cal-dots-mobile'>" + dotsHtml + "</div>" : "") +
        "</div>";
    }

    elGrid.innerHTML = html;
  }

  function renderWeekView() {
    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(curWeekStart);
      d.setDate(curWeekStart.getDate() + i);
      days.push(d);
    }
    var first = days[0], last = days[6];
    var labelStr = MONTHS_SHORT[first.getMonth()] + " " + first.getDate() +
                   " – " + MONTHS_SHORT[last.getMonth()] + " " + last.getDate() + ", " + last.getFullYear();
    if (elLabel) elLabel.textContent = labelStr;

    var todayStr = toDs(today);
    var html = "";

    days.forEach(function (d) {
      var ds = toDs(d);
      var isT = ds === todayStr;
      html += "<div class='cal-dow" + (isT ? " cal-dow-today" : "") + "'>" +
        DOWS[d.getDay()] + "<br><span class='cal-dow-num'>" + d.getDate() + "</span></div>";
    });

    days.forEach(function (d) {
      var ds = toDs(d);
      var dayEvs = eventsOnDay(ds);
      var isT = ds === todayStr;
      var inner = "";
      if (!dayEvs.length) {
        inner = "<span class='week-no-games'>—</span>";
      } else {
        for (var i = 0; i < dayEvs.length; i++) {
          var ev = dayEvs[i];
          var sp = findSport(ev.sport);
          var col = sp ? sp.color : "#20242a";
          if (ev.allDay) {
            inner += "<div class='week-ev week-ev-allday' style='background:" + col + "18;border-left-color:" + col + "' data-date='" + ds + "'>" +
              "<span class='week-ev-emoji'>" + (sp ? sp.emoji : "") + "</span>" +
              "<span class='week-ev-title'>" + escH(ev.name) + "</span>" +
              "<span class='week-ev-sub'>" + escH(ev.tier || "") + "</span>" +
            "</div>";
          } else {
            var liveHtml = ev.status === "in" ? "<span class='game-status-live'>LIVE</span>" : "";
            inner += "<div class='week-ev' style='border-left-color:" + col + "' data-date='" + ds + "'>" +
              "<span class='week-ev-emoji'>" + (sp ? sp.emoji : "") + "</span>" +
              "<span class='week-ev-title'>" + escH(ev.teams || ev.name) + "</span>" +
              "<span class='week-ev-sub'>" + escH(ev.time || "") + (ev.broadcast ? " · " + escH(ev.broadcast) : "") + "</span>" +
              liveHtml +
            "</div>";
          }
        }
      }
      html += "<div class='cal-week-col" + (isT ? " cal-today" : "") + (ds === selDay ? " cal-selected" : "") + "' data-date='" + ds + "'>" + inner + "</div>";
    });

    elGrid.innerHTML = html;
  }

  function renderDetail(ds) {
    if (!elDetail || !elDetDate || !elDetEvts) return;
    var evs = eventsOnDay(ds);
    var d = new Date(ds + "T12:00:00");
    elDetDate.textContent = d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });
    if (!evs.length) {
      elDetEvts.innerHTML = "<p class='cal-empty-msg'>No games for your selected sports on this day.</p>";
    } else {
      elDetEvts.innerHTML = evs.map(buildDetailCard).join("");
    }
    elDetail.removeAttribute("hidden");
    setTimeout(function () { elDetail.scrollIntoView({ behavior:"smooth", block:"nearest" }); }, 40);
  }

  function buildDetailCard(ev) {
    var sp    = findSport(ev.sport);
    var color = sp ? sp.color : "#20242a";
    var emoji = sp ? sp.emoji : "";
    var statusHtml = ev.status === "in"
      ? "<span class='game-status-live'>LIVE</span>"
      : (ev.status === "post" && ev.score ? "<span class='detail-score'>" + escH(ev.score) + "</span>" : "");

    if (ev.allDay) {
      var surfCls = "surface-" + (ev.surface || "").toLowerCase();
      return "<div class='detail-card'>" +
        "<div class='detail-sport-dot' style='background:" + color + "'>" + emoji + "</div>" +
        "<div class='detail-card-body'>" +
          "<span class='detail-teams'>" + escH(ev.name) + "</span>" +
          (ev.tier ? "<span class='detail-meta'><span class='surface-badge " + surfCls + "'>" + escH(ev.surface) + "</span> " + escH(ev.tier) + "</span>" : "") +
          (ev.prize ? "<span class='detail-meta detail-prize'>" + escH(ev.prize) + "</span>" : "") +
          "<span class='detail-meta'>" + escH(ev.venue || "") + "</span>" +
        "</div>" +
        "<button class='game-add-cal' data-add-cal='" + escH(ev.id) + "'>+ Cal</button>" +
        "</div>";
    }
    return "<div class='detail-card'>" +
      "<div class='detail-sport-dot' style='background:" + color + "'>" + emoji + "</div>" +
      "<div class='detail-card-body'>" +
        "<span class='detail-teams'>" + escH(ev.teams || ev.name) + "</span>" +
        "<span class='detail-meta'>" + escH(ev.time || "") + (ev.broadcast ? " · " + escH(ev.broadcast) : "") + "</span>" +
        (ev.venue ? "<span class='detail-meta'>" + escH(ev.venue) + "</span>" : "") +
        statusHtml +
      "</div>" +
      "<button class='game-add-cal' data-add-cal='" + escH(ev.id) + "'>+ Cal</button>" +
      "</div>";
  }

  function buildAvatar(p, bg, overrideStyle) {
    var avatarHtml = p.photo
      ? "<img src='" + p.photo + "' class='fp-photo' alt='" + escH(p.name) + "'" +
        " onerror=\"this.style.display='none';this.nextSibling.style.display='flex'\" loading='lazy' />" +
        "<span class='fp-initials' style='display:none'>" + escH(p.name.charAt(0)) + "</span>"
      : "<span class='fp-initials'>" + escH(p.name.charAt(0)) + "</span>";
    var avStyle = overrideStyle || ("background:" + bg + "15;border-color:" + bg + "30");
    return "<div class='fp-item'>" +
      "<div class='fp-avatar' style='" + avStyle + "'>" + avatarHtml + "</div>" +
      "<span class='fp-name'>" + escH(p.name) + "</span>" +
    "</div>";
  }

  function buildFeaturedCard(f) {
    var playersHtml = f.players.map(function(p){ return buildAvatar(p, f.bg); }).join("");
    var logoHtml = f.logo
      ? "<img src='" + f.logo + "' class='following-logo-img following-logo-featured' alt='' loading='lazy' />"
      : "";
    var badgeHtml = f.badge
      ? "<span class='following-badge'>" + escH(f.badge) + "</span>"
      : "";
    return "<div class='following-card following-card-featured'>" +
      "<div class='following-card-hd' style='background:" + f.bg + ";color:" + f.fg + "'>" +
        "<span class='following-emoji'>" + f.emoji + "</span>" +
        "<div>" +
          "<span class='following-sport'>" + escH(f.sport) + "</span>" +
          "<strong class='following-name'>" + escH(f.name) + "</strong>" +
          badgeHtml +
        "</div>" +
        (logoHtml ? "<div class='following-logo-wrap'>" + logoHtml + "</div>" : "") +
      "</div>" +
      "<div class='following-card-bd following-card-bd-featured'>" +
        "<p class='following-note'>" + escH(f.note) + "</p>" +
        "<div class='fp-row'>" + playersHtml + "</div>" +
      "</div>" +
    "</div>";
  }

  function buildBannerCard(f) {
    var start = new Date("2026-06-11T00:00:00");
    var now = new Date(); now.setHours(0,0,0,0);
    var diff = Math.ceil((start - now) / 86400000);
    var daysStr = diff > 0 ? diff + " days away" : (diff === 0 ? "Starts today!" : "Underway!");
    var playersHtml = f.players.map(function(p){
      return buildAvatar(p, "#ffffff", "background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.35)");
    }).join("");
    return "<div class='following-card following-card-banner'>" +
      "<div class='banner-left'>" +
        "<span class='banner-emoji'>" + f.emoji + "</span>" +
        "<div>" +
          "<span class='following-sport banner-sport'>" + escH(f.sport) + "</span>" +
          "<strong class='following-name banner-name'>" + escH(f.name) + "</strong>" +
          "<p class='following-note banner-note'>" + escH(f.note) + "</p>" +
        "</div>" +
      "</div>" +
      "<div class='banner-right'>" +
        "<div class='banner-stats'>" +
          "<div class='banner-stat'><span class='banner-stat-val'>48</span><span class='banner-stat-lbl'>Teams</span></div>" +
          "<div class='banner-stat-sep'></div>" +
          "<div class='banner-stat'><span class='banner-stat-val'>Jun 11</span><span class='banner-stat-lbl'>Kickoff · USA</span></div>" +
          "<div class='banner-stat-sep'></div>" +
          "<div class='banner-stat'><span class='banner-stat-val'>" + escH(daysStr) + "</span><span class='banner-stat-lbl'>Countdown</span></div>" +
        "</div>" +
        "<div class='fp-row banner-fp-row'>" + playersHtml + "</div>" +
      "</div>" +
    "</div>";
  }

  function buildCompactCard(f) {
    var briefHtml = f.facts.map(function(fact){
      return "<span class='following-fact'>" + escH(fact) + "</span>";
    }).join("");
    var playersHtml = f.players.map(function(p){ return buildAvatar(p, f.bg); }).join("");
    var logoHtml = f.logo
      ? "<img src='" + f.logo + "' class='following-logo-img' alt='' loading='lazy' />"
      : "";
    var badgeHtml = f.badge
      ? "<span class='following-badge'>" + escH(f.badge) + "</span>"
      : "";
    return "<div class='following-card'>" +
      "<div class='following-card-hd' style='background:" + f.bg + ";color:" + f.fg + "'>" +
        "<span class='following-emoji'>" + f.emoji + "</span>" +
        "<div>" +
          "<span class='following-sport'>" + escH(f.sport) + "</span>" +
          "<strong class='following-name'>" + escH(f.name) + "</strong>" +
          badgeHtml +
        "</div>" +
        (logoHtml ? "<div class='following-logo-wrap'>" + logoHtml + "</div>" : "") +
      "</div>" +
      "<div class='following-card-bd'>" +
        "<div class='following-facts-brief'>" + briefHtml + "</div>" +
        "<div class='following-expand'>" +
          "<p class='following-note'>" + escH(f.note) + "</p>" +
          "<div class='fp-row'>" + playersHtml + "</div>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  function renderFollowing() {
    if (!elFollowing) return;
    var featured = FOLLOWING.filter(function(f){ return f.featured; });
    var banner   = FOLLOWING.filter(function(f){ return f.banner; });
    var compact  = FOLLOWING.filter(function(f){ return !f.featured && !f.banner; });
    var html = "";
    featured.forEach(function(f){ html += buildFeaturedCard(f); });
    banner.forEach(function(f){   html += buildBannerCard(f); });
    if (compact.length) {
      html += "<div class='following-tier-divider'>Also following</div>";
      compact.forEach(function(f){ html += buildCompactCard(f); });
    }
    elFollowing.innerHTML = html;
  }

  document.addEventListener("click", function (e) {
    // View toggle
    var viewBtn = e.target.closest("[data-view]");
    if (viewBtn) {
      curView = viewBtn.dataset.view;
      [].forEach.call(document.querySelectorAll(".cal-view-btn"), function (b) {
        b.classList.toggle("active", b.dataset.view === curView);
      });
      selDay = null;
      if (elDetail) elDetail.setAttribute("hidden", "");
      renderCal();
      return;
    }
    // Day click
    var dayEl = e.target.closest("[data-date]");
    if (dayEl && elGrid && elGrid.contains(dayEl)) {
      selDay = dayEl.dataset.date;
      [].forEach.call(elGrid.querySelectorAll(".cal-selected"), function (el) { el.classList.remove("cal-selected"); });
      dayEl.classList.add("cal-selected");
      renderDetail(selDay);
      return;
    }
    // Nav (month or week)
    var navBtn = e.target.closest("[data-nav]");
    if (navBtn) {
      var delta = parseInt(navBtn.dataset.nav, 10);
      if (curView === "week") {
        curWeekStart = new Date(curWeekStart);
        curWeekStart.setDate(curWeekStart.getDate() + delta * 7);
      } else {
        curMonth += delta;
        if (curMonth > 11) { curMonth = 0; curYear++; }
        if (curMonth < 0)  { curMonth = 11; curYear--; }
      }
      selDay = null;
      if (elDetail) elDetail.setAttribute("hidden", "");
      renderCal();
      return;
    }
    // Filter chip
    var chipEl = e.target.closest("[data-fkey]");
    if (chipEl && elFilters && elFilters.contains(chipEl)) {
      var key = chipEl.dataset.fkey;
      activeFilters[key] = !activeFilters[key];
      chipEl.classList.toggle("inactive", !activeFilters[key]);
      renderCal();
      if (selDay) renderDetail(selDay);
      return;
    }
    // Close detail
    if (e.target.closest("[data-detail-close]")) {
      if (elDetail) elDetail.setAttribute("hidden", "");
      selDay = null;
      if (elGrid) [].forEach.call(elGrid.querySelectorAll(".cal-selected"), function (el) { el.classList.remove("cal-selected"); });
      return;
    }
    // Export
    if (e.target.closest("[data-export]")) {
      var toExp = [];
      for (var i = 0; i < allEvents.length; i++) {
        if (activeFilters[allEvents[i].sport]) toExp.push(allEvents[i]);
      }
      downloadICS(generateICS(toExp), "bowen-sports.ics");
      return;
    }
    // Add single event
    var addBtn = e.target.closest("[data-add-cal]");
    if (addBtn) {
      var evId = addBtn.dataset.addCal;
      for (var j = 0; j < allEvents.length; j++) {
        if (allEvents[j].id === evId) { downloadICS(generateICS([allEvents[j]]), "game.ics"); break; }
      }
    }
  });

  function fetchAll() {
    addTennisEvents();
    SPORTS.forEach(function (s) {
      if (s.type === "static") return;
      if (s.type === "team") fetchTeam(s);
      else                   fetchScoreboard(s);
    });
  }

  function addTennisEvents() {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    WANG_XINYU.forEach(function (t) {
      var startD = new Date(t.start + "T00:00:00");
      var endD   = new Date(t.end   + "T00:00:00");
      allEvents.push({
        id: t.id, date: t.start, startDate: t.start, endDate: t.end,
        sport: "tennis", name: t.name, teams: "", time: "", venue: t.venue,
        broadcast: "", score: "", isoDate: t.start + "T00:00:00Z",
        status: endD < now ? "post" : (startD <= now ? "in" : "pre"),
        tier: t.tier, prize: t.prize || "", surface: t.surface, allDay: true,
      });
    });
    renderCal();
  }

  function fetchTeam(sport) {
    fetch(sport.url)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var evs = d.events || [];
        for (var i = 0; i < evs.length; i++) {
          var n = normalizeEv(evs[i], sport.key);
          if (n) allEvents.push(n);
        }
        renderCal();
        if (selDay) renderDetail(selDay);
      })
      .catch(function () {});
  }

  function fetchScoreboard(sport) {
    var url = ESPN_BASE + sport.league + "/scoreboard?dates=" + DATE_FROM + "-" + DATE_TO + "&limit=300";
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var evs = d.events || [];
        for (var i = 0; i < evs.length; i++) {
          var n = normalizeEv(evs[i], sport.key);
          if (n) allEvents.push(n);
        }
        renderCal();
        if (selDay) renderDetail(selDay);
      })
      .catch(function () {});
  }

  function normalizeEv(ev, sportKey) {
    if (!ev.date) return null;
    var ds   = ev.date.substring(0, 10);
    var comp = (ev.competitions && ev.competitions[0]) || {};
    var stat = (comp.status && comp.status.type) || {};
    var state = stat.state || "pre";
    var d = new Date(ev.date);
    var timeStr = d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
    var venue = (comp.venue && comp.venue.fullName) || "";
    var broadcast = "";
    if (comp.broadcasts && comp.broadcasts[0]) {
      var b = comp.broadcasts[0];
      var names = b.names || (b.media && [b.media.shortName]) || [];
      broadcast = names[0] || "";
    }
    var comps = comp.competitors || [];
    var teams = "", score = "";
    if (comps.length >= 2) {
      var away = null, home = null;
      for (var i = 0; i < comps.length; i++) {
        if (comps[i].homeAway === "away") away = comps[i];
        else home = comps[i];
      }
      if (!away) away = comps[0];
      if (!home) home = comps[1];
      var aA = (away.team && (away.team.abbreviation || away.team.shortDisplayName)) || "?";
      var hA = (home.team && (home.team.abbreviation || home.team.shortDisplayName)) || "?";
      teams = aA + " @ " + hA;
      if ((state === "in" || state === "post") && away.score != null && home.score != null) {
        score = away.score + " – " + home.score;
      }
    } else {
      teams = ev.shortName || ev.name || "";
    }
    return {
      id: ev.id || (sportKey + "-" + ds + "-" + (Math.random() * 1e6 | 0)),
      date: ds, isoDate: ev.date,
      sport: sportKey, name: ev.name || teams || "",
      teams: teams, time: timeStr, venue: venue,
      broadcast: broadcast, status: state, score: score,
    };
  }

  function icsDateStr(ev, useEnd) {
    if (ev.allDay) {
      var s = useEnd ? (ev.endDate || ev.date) : ev.date;
      return s.replace(/-/g, "");
    }
    var iso = useEnd
      ? new Date(new Date(ev.isoDate || ev.date).getTime() + 7200000).toISOString()
      : (ev.isoDate || ev.date + "T00:00:00Z");
    return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function generateICS(events) {
    var lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Bowen Sports Calendar//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
    events.forEach(function (ev) {
      if (!ev.date) return;
      var allDay = !!ev.allDay;
      lines.push(
        "BEGIN:VEVENT",
        "UID:" + escICS(ev.id) + "@bowen-sports",
        "DTSTART" + (allDay ? ";VALUE=DATE:" : ":") + icsDateStr(ev, false),
        "DTEND"   + (allDay ? ";VALUE=DATE:" : ":") + icsDateStr(ev, true),
        "SUMMARY:" + escICS(ev.teams || ev.name),
        "DESCRIPTION:" + escICS(ev.tier || ev.sport || ""),
        "LOCATION:" + escICS(ev.venue || ""),
        "END:VEVENT"
      );
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function downloadICS(content, filename) {
    var blob = new Blob([content], { type:"text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || "schedule.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  var urlSport = new URLSearchParams(location.search).get("sport");
  if (urlSport) {
    var targetKey = ESPN_TO_KEY[decodeURIComponent(urlSport)];
    if (targetKey) {
      SPORTS.forEach(function (s) { activeFilters[s.key] = (s.key === targetKey); });
    }
  }

  renderFilters();
  renderCal();
  renderFollowing();
  fetchAll();

})();

