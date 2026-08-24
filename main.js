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
    { key:"pl",      label:"PL",      full:"Premier League",   emoji:"⚽️", color:"#3d195b", type:"scoreboard", league:"soccer/eng.1" },
    { key:"ucl",     label:"UCL",     full:"Champions League", emoji:"👑",  color:"#1d47ba", type:"scoreboard", league:"soccer/uefa.champions" },
    { key:"dodgers", label:"Dodgers", full:"LA Dodgers",       emoji:"⚾️", color:"#005a9c", type:"team",       url:ESPN_BASE + "baseball/mlb/teams/19/schedule" },
    { key:"nfl",     label:"NFL",     full:"NFL",              emoji:"🏈",  color:"#013369", type:"scoreboard", league:"football/nfl" },
    { key:"ncaa",    label:"NCAA",    full:"NCAA Football",    emoji:"🏈",  color:"#bf5700", type:"scoreboard", league:"football/college-football" },
  ];

  // ESPN headshots only for players whose IDs are confirmed
  var ESPN_HS = "https://a.espncdn.com/combiner/i?img=/i/headshots/";
  var FOLLOWING = [
    {
      key:"alonso", name:"Fernando Alonso", sport:"Formula 1", emoji:"🏎️", bg:"#003a33", fg:"#7db320",
      featured:true, badge:"2026 Season", logo:"assets/following/aston-martin.png", matchAbbrs:["ALO"],
      facts:["2× World Champion","Aston Martin AMR25","El Plan 33"],
      note:"Watched him dominate in Ferrari red. Still chasing that 3rd title at Aston Martin.",
      players:[
        { name:"Alonso #14", photo:"assets/following/alonso.jpg" },
      ],
    },
    {
      key:"lakers", name:"LA Lakers", sport:"NBA", emoji:"🏀", bg:"#371855", fg:"#d49c1e",
      featured:true, badge:"Playoffs 🔥", logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/lal.png", matchAbbrs:["LAL"],
      facts:["17× NBA Champion","Luka Doncic era","Crypto.com Arena"],
      note:"Been watching since Kobe's 2010 chip. Luka is the franchise now.",
      players:[
        { name:"Luka Doncic",  photo: ESPN_HS + "nba/players/full/3945274.png&h=260" },
        { name:"A. Reaves",    photo: ESPN_HS + "nba/players/full/4066457.png&h=260" },
      ],
    },
    {
      key:"xinyu", name:"Wang Xinyu", sport:"WTA Tennis", emoji:"🎾", bg:"#825707", fg:"#fef0c0",
      featured:true, badge:"Roland Garros 🌸", logo:"", matchAbbrs:["WANG", "XINYU"],
      facts:["China 🇨🇳","Right-handed","WTA Top 50"],
      note:"Following her rise through the WTA ranks. China's most exciting player.",
      players:[
        { name:"王欣瑜", photo:"assets/following/xinyu.jpg" },
      ],
    },
    {
      key:"dodgers", name:"LA Dodgers", sport:"MLB", emoji:"⚾️", bg:"#003a65", fg:"#c43033",
      logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/lad.png", matchAbbrs:["LAD"],
      facts:["2020 & 2024 Champions","Shohei Ohtani","Dodger Stadium"],
      note:"Yamamoto's arm is unreal. Back-to-back champions — this team is special.",
      players:[
        { name:"Shohei Ohtani", photo:"https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/660271/headshot/67/current" },
        { name:"Y. Yamamoto",   photo:"https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/808967/headshot/67/current" },
        { name:"F. Freeman",    photo:"https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/518692/headshot/67/current" },
      ],
    },
    {
      key:"spurs", name:"Tottenham Hotspur", sport:"Premier League", emoji:"⚽️", bg:"#0c1639", fg:"#ffffff",
      logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/253.png", matchAbbrs:["TOT"],
      facts:["Son Heung-min fan","1961 Double winners","Spurs Stadium, London"],
      note:"Son Heung-min fan since his breakout season. 손흥민.",
      players:[
        { name:"Son Heung-min", photo:"https://img.a.transfermarkt.technology/portrait/medium/246669.jpg" },
        { name:"J. Maddison",   photo:"https://img.a.transfermarkt.technology/portrait/medium/264655.jpg" },
      ],
    },
    {
      key:"usc", name:"USC Trojans", sport:"NCAA Football", emoji:"🏈", bg:"#630000", fg:"#d9a624",
      logo:"https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/30.png", matchAbbrs:["USC"],
      facts:["11× Natl Champions","Fight On!","LA Memorial Coliseum"],
      note:"Local school, big games. Fight On! Watch for the big rivalry matchups.",
      players:[
        { name:"Lincoln Riley HC", photo:"" },
      ],
    },
  ];

  var ESPN_TO_KEY = {
    "soccer/eng.1":"pl",    "soccer/uefa.champions":"ucl",
    "tennis":"tennis",      "basketball/nba":"nba",
    "football/college-football":"ncaa", "football/nfl":"nfl",
    "racing/f1":"f1",       "baseball/mlb":"dodgers",
  };

  var today      = new Date();
  var rangeStart = new Date(today.getFullYear(), today.getMonth(), 1);
  var rangeEnd   = new Date(today.getFullYear(), today.getMonth() + 6, 0);

  function fmtParam(d) { return "" + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()); }
  var DATE_FROM = fmtParam(rangeStart);
  var DATE_TO   = fmtParam(rangeEnd);

  var allEvents     = [];
  var activeFilters = {};
  SPORTS.forEach(function (s) { activeFilters[s.key] = false; });
  var curYear      = today.getFullYear();
  var curMonth     = today.getMonth();
  var curView      = "week";
  var curWeekStart = getWeekStart(today);
  var selDay       = null;
  var filtersInitialized = false;
  var filtersTouched = false;
  var requestedFilterKey = null;
  var dataLoading = true;

  function getWeekStart(d) {
    var w = new Date(d);
    w.setHours(0, 0, 0, 0);
    w.setDate(w.getDate() - w.getDay());
    return w;
  }

  function pad2(n)      { return n < 10 ? "0" + n : "" + n; }
  function toDs(d)      { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function escH(s)      { return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function escA(s)      { return escH(s).replace(/'/g,"&#39;"); }
  function escICS(s)    { return String(s || "").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n"); }
  function findSport(k) { for (var i = 0; i < SPORTS.length; i++) { if (SPORTS[i].key === k) return SPORTS[i]; } return null; }

  function colorIsLight(color) {
    var hex = String(color || "").replace("#", "");
    if (hex.length === 3) hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
    if (!/^[0-9a-f]{6}$/i.test(hex)) return false;
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.8;
  }

  function crestHTML(abbr, logo, color, size) {
    var bg = color || "#20242a";
    var fg = colorIsLight(bg) ? "#20242a" : "#fffdf8";
    return "<span class='crest' style='--crest-size:" + size + "px;--crest-bg:" + escA(bg) + ";--crest-fg:" + fg + "'>" +
      "<span class='crest-abbr'>" + escH(abbr || "?") + "</span>" +
      (logo ? "<img src='" + escA(logo) + "' alt='' loading='lazy' onerror=\"this.style.display='none'\" />" : "") +
    "</span>";
  }

  var elFilters   = document.querySelector("[data-filter-bar]");
  var elGrid      = document.querySelector("[data-cal-grid]");
  var elLabel     = document.querySelector("[data-month-label]");
  var elDetail    = document.querySelector("[data-cal-detail]");
  var elDetDate   = document.querySelector("[data-detail-date]");
  var elDetEvts   = document.querySelector("[data-detail-events]");
  var elFollowing = document.querySelector("[data-following-grid]");
  var elNextUp    = document.querySelector("[data-nextup]");
  var elWeekCount = document.querySelector("[data-week-count]");

  var MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var DOWS         = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  var SEASON_NOTE = {
    nba: "off-season · Oct 21",
    ncaa: "week 1 · Sep 5",
    tennis: "US Open · Aug 31",
    nfl: "preseason wk 3",
    pl: "", ucl: "", f1: "", dodgers: "",
  };

  function visibleRange() {
    if (curView === "week") {
      var weekEnd = new Date(curWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return { start: toDs(curWeekStart), end: toDs(weekEnd) };
    }
    return {
      start: curYear + "-" + pad2(curMonth + 1) + "-01",
      end: curYear + "-" + pad2(curMonth + 1) + "-" + pad2(new Date(curYear, curMonth + 1, 0).getDate()),
    };
  }

  function eventOverlaps(ev, start, end) {
    var evStart = ev.startDate || ev.date || "";
    var evEnd = ev.endDate || ev.date || "";
    return evStart <= end && evEnd >= start;
  }

  function sportRangeCount(key, start, end) {
    var count = 0;
    for (var i = 0; i < allEvents.length; i++) {
      if (allEvents[i].sport === key && eventOverlaps(allEvents[i], start, end)) count++;
    }
    return count;
  }

  function nextSportEvent(key) {
    var nowMs = Date.now();
    var found = null;
    for (var i = 0; i < allEvents.length; i++) {
      var ev = allEvents[i];
      var evMs = new Date(ev.isoDate || (ev.date + "T12:00:00")).getTime();
      if (ev.sport === key && evMs >= nowMs && (!found || evMs < found.ms)) found = { ev:ev, ms:evMs };
    }
    return found && found.ev;
  }

  function renderFilters() {
    if (!elFilters) return;
    var range = visibleRange();
    var arranged = SPORTS.map(function (s, index) {
      return { sport:s, index:index, count:sportRangeCount(s.key, range.start, range.end), next:nextSportEvent(s.key) };
    });
    arranged.sort(function (a, b) {
      if (!!b.count !== !!a.count) return b.count ? 1 : -1;
      if (!!b.next !== !!a.next) return b.next ? 1 : -1;
      return a.index - b.index;
    });
    var btns = arranged.map(function (item) {
      var s = item.sport;
      var active = activeFilters[s.key];
      var note = "";
      if (dataLoading && !allEvents.length) note = "loading";
      else if (item.count) note = item.count + (curView === "week" ? " this week" : " this month");
      else if (item.next) {
        var nd = new Date(item.next.isoDate || (item.next.date + "T12:00:00"));
        note = "next " + MONTHS_SHORT[nd.getMonth()] + " " + nd.getDate();
      } else note = SEASON_NOTE[s.key] || "no fixtures";
      return "<button class='sport-pill" + (active ? " is-active" : "") + (!item.count && !item.next ? " sport-pill-offseason" : "") + "'" +
             " data-fkey='" + s.key + "' style='--cc:" + s.color + "'" +
             " aria-label='" + escH(s.full) + " filter' aria-pressed='" + (active ? "true" : "false") + "'>" +
             "<span class='sport-pill-emoji'>" + s.emoji + "</span>" +
             "<span class='sport-pill-copy'><span class='sport-pill-label'>" + escH(s.label) + "</span>" +
             "<span class='sport-pill-note'>" + escH(note) + "</span></span>" +
             "</button>";
    }).join("");
    elFilters.innerHTML = "<div class='cal-filter-inner'>" + btns + "</div>";
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
    renderFilters();
    renderNextUp();
    updateFootnote();
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
        var spKey = sp ? sp.key : "";
        if (ev.allDay) {
          chipsHtml += "<span class='cal-chip cal-chip-allday'" +
            " style='--chip-bg:" + col + "'" +
            " data-sport='" + escA(spKey) + "'" +
            " data-teams='" + escA(ev.name || "") + "'" +
            " data-venue='" + escA(ev.venue || "") + "'" +
            " data-allday='1'>" +
            escH(ev.name.split(" ")[0]) + "</span>";
        } else {
          var lbl = (ev.teams || ev.name || "").substring(0, 14);
          chipsHtml += "<span class='cal-chip'" +
            " style='--chip-bg:" + col + "'" +
            " data-sport='" + escA(spKey) + "'" +
            " data-teams='" + escA(ev.teams || ev.name || "") + "'" +
            " data-time='" + escA(ev.time || "") + "'" +
            " data-venue='" + escA(ev.venue || "") + "'" +
            " data-status='" + escA(ev.status || "pre") + "'" +
            " data-score='" + escA(ev.score || "") + "'>" +
            crestHTML(ev.homeAbbr, ev.homeLogo, ev.homeColor, 14) +
            "<span class='cal-chip-text'>" + escH(lbl) + "</span></span>";
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
        (dayEvs.length ? "<span class='cal-mobile-count'>" + dayEvs.length + "</span>" : "") +
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
      var dayEvs = eventsOnDay(ds);
      var isT = ds === todayStr;
      var isPast = ds < todayStr;
      var inner = "";
      dayEvs.sort(function (a, b) {
        if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
        return new Date(a.isoDate || (a.date + "T12:00:00")) - new Date(b.isoDate || (b.date + "T12:00:00"));
      });
      if (!dayEvs.length) {
        inner = "<span class='week-no-games'><strong>No games</strong><span>for your sports</span></span>";
      } else {
        for (var i = 0; i < dayEvs.length; i++) {
          var ev = dayEvs[i];
          var sp = findSport(ev.sport);
          var col = sp ? sp.color : "#20242a";
          var wSpKey = sp ? sp.key : "";
          if (ev.allDay) {
            inner += "<div class='week-ev week-ev-allday'" +
              " style='border-left-color:" + col + "'" +
              " data-date='" + ds + "'" +
              " data-sport='" + escA(wSpKey) + "'" +
              " data-teams='" + escA(ev.name || "") + "'" +
              " data-venue='" + escA(ev.venue || "") + "'" +
              " data-allday='1'>" +
              "<span class='week-ev-top'><strong>All day</strong><span>" + escH(sp ? sp.label : "") + "</span></span>" +
              "<span class='week-ev-matchup'><span class='week-ev-tournament-icon'>" + (sp ? sp.emoji : "") + "</span>" +
              "<span class='week-ev-title'>" + escH(ev.name) + "</span></span>" +
              "<span class='week-ev-broadcast'>" + escH(ev.tier || ev.venue || "Tournament") + "</span>" +
            "</div>";
          } else {
            var liveHtml = ev.status === "in" ? "<span class='game-status-live'>LIVE</span>" : "";
            var scoreHtml = ev.status === "post" && ev.score ? "<span class='week-ev-score'>" + escH(ev.score) + "</span>" : liveHtml;
            inner += "<div class='week-ev" + (ev.status === "post" ? " is-post" : "") + "'" +
              " style='border-left-color:" + col + "'" +
              " data-date='" + ds + "'" +
              " data-sport='" + escA(wSpKey) + "'" +
              " data-teams='" + escA(ev.teams || ev.name || "") + "'" +
              " data-time='" + escA(ev.time || "") + "'" +
              " data-venue='" + escA(ev.venue || "") + "'" +
              " data-status='" + escA(ev.status || "pre") + "'" +
              " data-score='" + escA(ev.score || "") + "'>" +
              "<span class='week-ev-top'><strong>" + escH(ev.time || "TBD") + "</strong>" + scoreHtml + "</span>" +
              "<span class='week-ev-matchup'>" +
                crestHTML(ev.awayAbbr, ev.awayLogo, ev.awayColor, 21) +
                "<span class='week-ev-title'>" + escH(ev.teams || ev.name) + "</span>" +
                crestHTML(ev.homeAbbr, ev.homeLogo, ev.homeColor, 21) +
              "</span>" +
              "<span class='week-ev-broadcast'>" + escH(ev.broadcast || "Broadcast TBD") + "</span>" +
            "</div>";
          }
        }
      }
      html += "<div class='cal-weekday" + (isT ? " cal-today" : "") + (isPast ? " cal-past" : "") + (ds === selDay ? " cal-selected" : "") + "' data-date='" + ds + "'>" +
        "<div class='cal-weekhd'><span>" + DOWS[d.getDay()].toUpperCase() + "</span><strong>" + d.getDate() + "</strong></div>" +
        "<div class='cal-weekbody'>" + inner + "</div>" +
      "</div>";
    });

    elGrid.innerHTML = html;
  }

  function followedRank(ev) {
    var teamAbbrs = [ev.awayAbbr || "", ev.homeAbbr || ""].map(function (value) { return String(value).toUpperCase(); });
    var haystack = ((ev.name || "") + " " + (ev.awayName || "") + " " + (ev.homeName || "")).toUpperCase();
    for (var i = 0; i < FOLLOWING.length; i++) {
      var tokens = FOLLOWING[i].matchAbbrs || [];
      for (var j = 0; j < tokens.length; j++) {
        var token = String(tokens[j]).toUpperCase();
        if (teamAbbrs.indexOf(token) !== -1 || (!ev.awayAbbr && haystack.indexOf(token) !== -1)) return i;
      }
    }
    return 999;
  }

  function eventTimeMs(ev) {
    return new Date(ev.isoDate || (ev.date + "T12:00:00")).getTime();
  }

  function countdownLabel(ms) {
    var diff = ms - Date.now();
    var hours = Math.max(0, Math.ceil(diff / 3600000));
    if (hours < 24) return { text:hours <= 1 ? "< 1 hour" : "in " + hours + "h", soon:true };
    var days = Math.ceil(diff / 86400000);
    return { text:days === 1 ? "tomorrow" : "in " + days + " days", soon:false };
  }

  function nextUpCard(ev) {
    var sp = findSport(ev.sport);
    var color = sp ? sp.color : "#20242a";
    var when = new Date(ev.isoDate || (ev.date + "T12:00:00"));
    var countdown = countdownLabel(when.getTime());
    var dateLabel = DOWS[when.getDay()] + " " + when.getDate() + " · " + (ev.allDay ? "All day" : (ev.time || "TBD"));
    var matchup = ev.awayName && ev.homeName ? ev.awayName + " @ " + ev.homeName : (ev.teams || ev.name || "Fixture");
    var eventLabel = sp ? sp.label : "Fixture";
    if (ev.eventLabel && !/^(std|regular season)$/i.test(ev.eventLabel) && ev.eventLabel.toLowerCase() !== eventLabel.toLowerCase()) {
      eventLabel += " · " + ev.eventLabel;
    }
    return "<article class='cal-nextup-card'>" +
      "<div class='cal-nextup-top'><span class='cal-nextup-league'><i style='background:" + color + "'></i>" + escH(eventLabel) + "</span>" +
      "<span class='cal-nextup-countdown" + (countdown.soon ? " is-soon" : "") + "'>" + escH(countdown.text) + "</span></div>" +
      "<div class='cal-nextup-match'>" +
        crestHTML(ev.awayAbbr || (sp && sp.label), ev.awayLogo, ev.awayColor || color, 44) +
        "<strong>" + escH(matchup) + "</strong>" +
        crestHTML(ev.homeAbbr || (sp && sp.label), ev.homeLogo, ev.homeColor || color, 44) +
      "</div>" +
      "<div class='cal-nextup-bottom'><span>" + escH(dateLabel) + "</span>" +
      "<button class='game-add-cal' data-add-cal='" + escA(ev.id) + "'>+ Cal</button></div>" +
    "</article>";
  }

  function renderNextUp() {
    if (!elNextUp) return;
    var nowMs = Date.now();
    var candidates = allEvents.filter(function (ev) {
      return activeFilters[ev.sport] && eventTimeMs(ev) > nowMs;
    });
    candidates.sort(function (a, b) {
      var aFollow = followedRank(a), bFollow = followedRank(b);
      var aMatched = aFollow < 999, bMatched = bFollow < 999;
      if (aMatched !== bMatched) return aMatched ? -1 : 1;
      return eventTimeMs(a) - eventTimeMs(b);
    });
    var picked = [], seen = {};
    for (var i = 0; i < candidates.length && picked.length < 3; i++) {
      var key = candidates[i].sport + "-" + candidates[i].id;
      if (!seen[key]) { seen[key] = true; picked.push(candidates[i]); }
    }
    if (!picked.length) {
      elNextUp.innerHTML = "<div class='cal-nextup-empty'>" +
        (dataLoading ? "Loading upcoming fixtures…" : "No upcoming fixtures for the selected competitions.") +
      "</div>";
      return;
    }
    elNextUp.innerHTML = picked.map(nextUpCard).join("");
  }

  function updateFootnote() {
    if (!elWeekCount) return;
    var start = toDs(curWeekStart);
    var endDate = new Date(curWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    var end = toDs(endDate);
    var count = 0;
    for (var i = 0; i < allEvents.length; i++) {
      if (activeFilters[allEvents[i].sport] && eventOverlaps(allEvents[i], start, end)) count++;
    }
    elWeekCount.textContent = count + (count === 1 ? " game" : " games") + " this week · dimmed rows are finished";
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
      "<div class='detail-crests'>" +
        crestHTML(ev.awayAbbr, ev.awayLogo, ev.awayColor || color, 32) +
        crestHTML(ev.homeAbbr, ev.homeLogo, ev.homeColor || color, 32) +
      "</div>" +
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
    // Reset the active view to today
    if (e.target.closest("[data-today]")) {
      curWeekStart = getWeekStart(today);
      curYear = today.getFullYear();
      curMonth = today.getMonth();
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
      filtersTouched = true;
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

  // ── Chip hover tooltip ──────────────────────────────────────
  var chipTip = document.createElement("div");
  chipTip.className = "cal-chip-tip";
  chipTip.setAttribute("aria-hidden", "true");
  document.body.appendChild(chipTip);

  var _hideTimer = null;

  function showChipTip(chip) {
    clearTimeout(_hideTimer);

    var sp = findSport(chip.dataset.sport || "");
    var emoji     = sp ? sp.emoji : "";
    var sportName = sp ? sp.full  : "";
    var teams   = chip.dataset.teams  || chip.textContent.trim() || "";
    var time    = chip.dataset.time   || "";
    var venue   = chip.dataset.venue  || "";
    var status  = chip.dataset.status || "pre";
    var score   = chip.dataset.score  || "";
    var isAllDay = chip.dataset.allday === "1";

    var statusHtml = "";
    if (status === "in") {
      statusHtml = "<span class='cal-chip-tip-live'>● LIVE</span>";
    } else if (status === "post" && score) {
      statusHtml = "<span class='cal-chip-tip-score'>" + escH(score) + "</span>";
    }

    var sub = isAllDay
      ? "All day" + (venue ? " · " + venue : "")
      : [time, venue].filter(Boolean).join(" · ");

    chipTip.innerHTML =
      "<span class='cal-chip-tip-sport'>" + emoji + " " + escH(sportName) + "</span>" +
      "<strong class='cal-chip-tip-teams'>" + escH(teams) + statusHtml + "</strong>" +
      (sub ? "<span class='cal-chip-tip-sub'>" + escH(sub) + "</span>" : "");

    // position: fixed — viewport coords, no scrollY needed
    var rect   = chip.getBoundingClientRect();
    var tipW   = 220;
    var tipH   = chipTip.offsetHeight || 64;
    var chipCx = rect.left + rect.width / 2;
    var clampedLeft = Math.max(tipW / 2 + 8, Math.min(chipCx, window.innerWidth - tipW / 2 - 8));
    var arrowLeft   = Math.max(18, Math.min(chipCx - (clampedLeft - tipW / 2), tipW - 18));

    chipTip.style.left = (clampedLeft - tipW / 2) + "px";
    chipTip.style.top  = (rect.top - tipH - 10) + "px";
    chipTip.style.setProperty("--tip-ax", arrowLeft + "px");
    chipTip.classList.add("is-visible");
  }

  function hideChipTip() {
    _hideTimer = setTimeout(function () {
      chipTip.classList.remove("is-visible");
    }, 80);
  }

  if (elGrid) {
    elGrid.addEventListener("mouseover", function (e) {
      var chip = e.target.closest(".cal-chip[data-sport], .week-ev[data-sport]");
      if (chip) showChipTip(chip);
    });
    elGrid.addEventListener("mouseout", function (e) {
      if (e.target.closest(".cal-chip[data-sport], .week-ev[data-sport]")) hideChipTip();
    });
  }
  // ────────────────────────────────────────────────────────────

  function fetchAll() {
    addTennisEvents();
    var tasks = [];
    SPORTS.forEach(function (s) {
      if (s.type === "static") return;
      tasks.push(s.type === "team" ? fetchTeam(s) : fetchScoreboard(s));
    });
    Promise.all(tasks).then(function () {
      dataLoading = false;
      initializeFilters();
      renderCal();
      if (selDay) renderDetail(selDay);
    });
  }

  function initializeFilters() {
    if (filtersInitialized || filtersTouched) return;
    filtersInitialized = true;
    SPORTS.forEach(function (s) { activeFilters[s.key] = false; });
    if (requestedFilterKey) {
      activeFilters[requestedFilterKey] = true;
      return;
    }
    var nowMs = Date.now();
    var opened = 0;
    SPORTS.forEach(function (s) {
      var hasUpcoming = allEvents.some(function (ev) {
        return ev.sport === s.key && eventTimeMs(ev) >= nowMs;
      });
      activeFilters[s.key] = hasUpcoming;
      if (hasUpcoming) opened++;
    });
    if (!opened) {
      ["pl", "ucl", "dodgers", "nfl", "f1"].forEach(function (key) { activeFilters[key] = true; });
    }
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
    return fetch(sport.url)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        ingestEvents(d.events || [], sport.key);
      })
      .catch(function () {});
  }

  function fetchScoreboard(sport) {
    var url = ESPN_BASE + sport.league + "/scoreboard?dates=" + DATE_FROM + "-" + DATE_TO + "&limit=300";
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var evs = d.events || [];
        ingestEvents(evs, sport.key);
        if (sport.key === "nfl" && nflNeedsWeeklyFallback(evs)) return fetchNFLWeeks(sport);
      })
      .catch(function () {});
  }

  function nflNeedsWeeklyFallback(events) {
    if (events.length < 8) return true;
    var dates = events.map(function (ev) { return new Date(ev.date || 0).getTime(); }).filter(function (value) { return isFinite(value); });
    if (dates.length < 2) return true;
    return (Math.max.apply(Math, dates) - Math.min.apply(Math, dates)) < 45 * 86400000;
  }

  function fetchJsonSafe(url) {
    return fetch(url)
      .then(function (r) { return r.json(); })
      .catch(function () { return { events:[] }; });
  }

  function fetchNFLWeeks(sport) {
    var season = rangeStart.getMonth() <= 1 ? rangeStart.getFullYear() - 1 : rangeStart.getFullYear();
    var urls = [];
    var w;
    for (w = 1; w <= 3; w++) {
      urls.push(ESPN_BASE + "football/nfl/scoreboard?dates=" + season + "&seasontype=1&week=" + w);
    }
    for (w = 1; w <= 18; w++) {
      urls.push(ESPN_BASE + "football/nfl/scoreboard?dates=" + season + "&seasontype=2&week=" + w);
    }

    function nextBatch(index) {
      if (index >= urls.length) return Promise.resolve();
      var batch = urls.slice(index, index + 6).map(fetchJsonSafe);
      return Promise.all(batch).then(function (results) {
        results.forEach(function (d) { ingestEvents(d.events || [], sport.key); });
        return nextBatch(index + 6);
      }).catch(function () { return nextBatch(index + 6); });
    }

    return nextBatch(0);
  }

  function ingestEvents(events, sportKey) {
    var existing = {};
    for (var i = 0; i < allEvents.length; i++) existing[allEvents[i].sport + ":" + allEvents[i].id] = true;
    for (var j = 0; j < events.length; j++) {
      var n = normalizeEv(events[j], sportKey);
      var key = n && n.sport + ":" + n.id;
      if (n && !existing[key]) {
        existing[key] = true;
        allEvents.push(n);
      }
    }
  }

  function normalizeEv(ev, sportKey) {
    if (!ev.date) return null;
    var ds   = ev.date.substring(0, 10);
    if (ds < toDs(rangeStart) || ds > toDs(rangeEnd)) return null;
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
    var awayAbbr = "", homeAbbr = "", awayName = "", homeName = "";
    var awayLogo = "", homeLogo = "", awayColor = "", homeColor = "";
    if (comps.length >= 2) {
      var away = null, home = null;
      for (var i = 0; i < comps.length; i++) {
        if (comps[i].homeAway === "away") away = comps[i];
        else home = comps[i];
      }
      if (!away) away = comps[0];
      if (!home) home = comps[1];
      awayAbbr = (away.team && (away.team.abbreviation || away.team.shortDisplayName)) || "?";
      homeAbbr = (home.team && (home.team.abbreviation || home.team.shortDisplayName)) || "?";
      awayName = (away.team && (away.team.shortDisplayName || away.team.displayName || away.team.name)) || awayAbbr;
      homeName = (home.team && (home.team.shortDisplayName || home.team.displayName || home.team.name)) || homeAbbr;
      awayLogo = (away.team && (away.team.logo || (away.team.logos && away.team.logos[0] && away.team.logos[0].href))) || "";
      homeLogo = (home.team && (home.team.logo || (home.team.logos && home.team.logos[0] && home.team.logos[0].href))) || "";
      awayColor = away.team && away.team.color ? (String(away.team.color).charAt(0) === "#" ? away.team.color : "#" + away.team.color) : "";
      homeColor = home.team && home.team.color ? (String(home.team.color).charAt(0) === "#" ? home.team.color : "#" + home.team.color) : "";
      teams = awayAbbr + " @ " + homeAbbr;
      if ((state === "in" || state === "post") && away.score != null && home.score != null) {
        var awayScore = typeof away.score === "object" ? (away.score.displayValue || away.score.value || "") : away.score;
        var homeScore = typeof home.score === "object" ? (home.score.displayValue || home.score.value || "") : home.score;
        score = awayScore + " – " + homeScore;
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
      awayAbbr: awayAbbr, homeAbbr: homeAbbr,
      awayName: awayName, homeName: homeName,
      awayLogo: awayLogo, homeLogo: homeLogo,
      awayColor: awayColor, homeColor: homeColor,
      eventLabel: (comp.notes && comp.notes[0] && comp.notes[0].headline) || (comp.type && (comp.type.abbreviation || comp.type.text)) || "",
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
      requestedFilterKey = targetKey;
    }
  }

  var tzText = "Local";
  try {
    var tzParts = new Date().toLocaleTimeString("en-US", { timeZoneName:"short" }).split(/\s+/);
    tzText = tzParts[tzParts.length - 1] || Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  } catch (e) {}
  [].forEach.call(document.querySelectorAll("[data-tz]"), function (el) { el.textContent = tzText; });

  renderFilters();
  renderCal();
  renderFollowing();
  fetchAll();

})();
