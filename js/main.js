/* ARNOVA Conference History Database — Main JS */

(function () {
  'use strict';

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
    });
  }

  // Mark active nav link
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // ---- Data Loading & Search (index & browse pages) ----
  var searchInput = document.getElementById('search-input');
  var yearFilter = document.getElementById('year-filter');
  var trackFilter = document.getElementById('track-filter');
  var resultsDiv = document.getElementById('search-results');
  var statsDiv = document.getElementById('search-stats');
  var paginationDiv = document.getElementById('pagination');

  if (!searchInput) return;

  var DATA = null;
  var filteredEntries = [];
  var currentPage = 1;
  var perPage = 20;

  fetch('data/site_data.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      DATA = data;
      populateFilters();
      renderChart();
      renderTracks();
      renderAffiliations();
      doSearch();
    })
    .catch(function (err) {
      if (resultsDiv) resultsDiv.innerHTML = '<p>Failed to load data.</p>';
      console.error(err);
    });

  function populateFilters() {
    if (!yearFilter || !DATA) return;
    var years = Object.keys(DATA.year_stats).sort().reverse();
    years.forEach(function (y) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y + ' (' + DATA.year_stats[y].count + ')';
      yearFilter.appendChild(opt);
    });

    if (!trackFilter) return;
    var tracks = Object.keys(DATA.track_counts).sort();
    tracks.forEach(function (t) {
      if (t.startsWith('(')) return;
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t + ' (' + DATA.track_counts[t] + ')';
      trackFilter.appendChild(opt);
    });
  }

  function doSearch() {
    if (!DATA) return;
    var q = (searchInput.value || '').toLowerCase().trim();
    var yearVal = yearFilter ? yearFilter.value : '';
    var trackVal = trackFilter ? trackFilter.value : '';

    filteredEntries = DATA.entries.filter(function (e) {
      if (yearVal && String(e.y) !== yearVal) return false;
      if (trackVal && e.tr !== trackVal) return false;
      if (q) {
        var searchable = (e.t + ' ' + (e.ab || '') + ' ' + (e.kw || '')).toLowerCase();
        var words = q.split(/\s+/);
        for (var i = 0; i < words.length; i++) {
          if (searchable.indexOf(words[i]) === -1) return false;
        }
      }
      return true;
    });

    currentPage = 1;
    renderResults();
  }

  function renderResults() {
    if (!resultsDiv) return;
    var total = filteredEntries.length;
    var totalPages = Math.ceil(total / perPage);
    var start = (currentPage - 1) * perPage;
    var page = filteredEntries.slice(start, start + perPage);

    if (statsDiv) {
      statsDiv.textContent = total.toLocaleString() + ' presentation' + (total !== 1 ? 's' : '') + ' found';
    }

    if (page.length === 0) {
      resultsDiv.innerHTML = '<p style="color:#999;padding:2rem 0;text-align:center;">No results found. Try a different search term.</p>';
      if (paginationDiv) paginationDiv.innerHTML = '';
      return;
    }

    var html = '';
    page.forEach(function (e) {
      html += '<div class="result-item">';
      html += '<div class="result-title">' + escHtml(e.t) + '</div>';
      html += '<div class="result-meta">';
      html += '<span class="year-badge">' + e.y + '</span>';
      if (e.tr) html += '<span class="track-badge">' + escHtml(e.tr) + '</span>';
      html += '</div>';
      if (e.ab) html += '<div class="result-abstract">' + escHtml(e.ab) + '</div>';
      html += '</div>';
    });
    resultsDiv.innerHTML = html;

    if (paginationDiv) renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) { paginationDiv.innerHTML = ''; return; }
    var html = '';
    html += '<button class="page-btn" ' + (currentPage === 1 ? 'disabled' : '') + ' data-page="' + (currentPage - 1) + '">&laquo;</button>';

    var startPage = Math.max(1, currentPage - 3);
    var endPage = Math.min(totalPages, currentPage + 3);
    if (startPage > 1) html += '<button class="page-btn" data-page="1">1</button><span style="padding:0 0.3rem;color:#999">...</span>';
    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="page-btn' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    if (endPage < totalPages) html += '<span style="padding:0 0.3rem;color:#999">...</span><button class="page-btn" data-page="' + totalPages + '">' + totalPages + '</button>';

    html += '<button class="page-btn" ' + (currentPage === totalPages ? 'disabled' : '') + ' data-page="' + (currentPage + 1) + '">&raquo;</button>';
    paginationDiv.innerHTML = html;

    paginationDiv.querySelectorAll('.page-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = parseInt(this.getAttribute('data-page'));
        if (p >= 1 && p <= totalPages) {
          currentPage = p;
          renderResults();
          resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  var searchTimer = null;
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(doSearch, 250);
  });
  if (yearFilter) yearFilter.addEventListener('change', doSearch);
  if (trackFilter) trackFilter.addEventListener('change', doSearch);

  // ---- Chart (index page only) ----
  function renderChart() {
    var canvas = document.getElementById('year-chart');
    if (!canvas || !DATA || typeof Chart === 'undefined') return;

    var years = Object.keys(DATA.year_stats).sort();
    var counts = years.map(function (y) { return DATA.year_stats[y].count; });

    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Presentations',
          data: counts,
          backgroundColor: 'rgba(46, 125, 50, 0.7)',
          borderColor: 'rgba(46, 125, 50, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function (ctx) {
                var y = years[ctx.dataIndex];
                var info = DATA.year_stats[y];
                return info.edition + ' Conference\n' + info.location;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { family: 'Inter', size: 11 } } },
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  }

  // ---- Tracks (index page only) ----
  function renderTracks() {
    var container = document.getElementById('track-list');
    if (!container || !DATA) return;

    var tracks = Object.entries(DATA.track_counts)
      .filter(function (t) { return !t[0].startsWith('('); })
      .sort(function (a, b) { return b[1] - a[1]; });

    var html = '';
    tracks.forEach(function (t) {
      html += '<div class="track-item"><span class="track-name">' + escHtml(t[0]) + '</span><span class="track-count">' + t[1] + '</span></div>';
    });
    container.innerHTML = html;
  }

  // ---- Top Affiliations (index page only) ----
  function renderAffiliations() {
    var container = document.getElementById('aff-list');
    if (!container || !DATA || !DATA.top_affiliations) return;

    var affs = DATA.top_affiliations.slice(0, 20);
    var maxCount = affs[0][1];
    var html = '';
    affs.forEach(function (item, i) {
      var pct = Math.round(item[1] / maxCount * 100);
      html += '<div class="aff-bar">';
      html += '<span class="aff-rank">' + (i + 1) + '</span>';
      html += '<span class="aff-name">' + escHtml(item[0]) + '</span>';
      html += '<span class="aff-fill" style="width:' + pct + 'px"></span>';
      html += '<span class="aff-count">' + item[1] + '</span>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();
