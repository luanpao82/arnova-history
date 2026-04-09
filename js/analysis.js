/* ARNOVA Conference History — Analysis Charts */

(function () {
  'use strict';

  var DATA = null;

  Chart.defaults.font.family = 'Inter, -apple-system, sans-serif';
  Chart.defaults.color = '#444';

  var COLORS = [
    '#2e7d32', '#1565c0', '#e65100', '#6a1b9a', '#00838f',
    '#c62828', '#4e342e', '#283593', '#00695c', '#ef6c00',
    '#ad1457', '#558b2f', '#0277bd', '#bf360c', '#4527a0',
    '#00796b', '#d84315', '#1b5e20', '#01579b', '#e53935'
  ];

  fetch('data/site_data.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      DATA = data;
      renderAll();
    })
    .catch(function (err) { console.error('Analysis data load failed:', err); });

  var FULL_DATA = null;

  function renderAll() {
    renderGrowthChart();
    renderTrackChart();
    renderCollaborationChart();
    renderKeywordChart();

    // Load full data for institution yearly breakdown
    fetch('data/full_data.json')
      .then(function (r) { return r.json(); })
      .then(function (full) { FULL_DATA = full; renderInstitutionChart(); })
      .catch(function () { renderInstitutionChart(); });
  }

  function getYears() {
    return Object.keys(DATA.year_stats).sort();
  }

  // ---- Analysis 1: Conference Growth ----
  function renderGrowthChart() {
    var canvas = document.getElementById('growth-chart');
    if (!canvas || !DATA) return;

    var years = getYears();
    var counts = years.map(function (y) { return DATA.year_stats[y].count; });

    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Presentations',
          data: counts,
          backgroundColor: counts.map(function (c, i) {
            var y = parseInt(years[i]);
            if (y >= 2020 && y <= 2022) return 'rgba(198, 40, 40, 0.6)';
            return 'rgba(46, 125, 50, 0.7)';
          }),
          borderColor: counts.map(function (c, i) {
            var y = parseInt(years[i]);
            if (y >= 2020 && y <= 2022) return 'rgba(198, 40, 40, 1)';
            return 'rgba(46, 125, 50, 1)';
          }),
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Presentations per Year', font: { size: 14, weight: '600' } },
          tooltip: {
            callbacks: {
              afterLabel: function (ctx) {
                var y = years[ctx.dataIndex];
                var info = DATA.year_stats[y];
                return info.edition + ' Conference — ' + info.location;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // ---- Analysis 2: Track Distribution ----
  function renderTrackChart() {
    var canvas = document.getElementById('track-chart');
    if (!canvas || !DATA) return;

    var tracks = Object.entries(DATA.track_counts)
      .filter(function (t) { return !t[0].startsWith('('); })
      .sort(function (a, b) { return b[1] - a[1]; });

    var labels = tracks.map(function (t) {
      var name = t[0];
      return name.length > 40 ? name.substring(0, 37) + '...' : name;
    });
    var values = tracks.map(function (t) { return t[1]; });

    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Presentations',
          data: values,
          backgroundColor: COLORS.slice(0, tracks.length).map(function (c) { return c + 'cc'; }),
          borderColor: COLORS.slice(0, tracks.length),
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Presentations by Track (2021–2024)', font: { size: 14, weight: '600' } },
          tooltip: {
            callbacks: {
              title: function (ctx) { return tracks[ctx[0].dataIndex][0]; }
            }
          }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
          y: { ticks: { font: { size: 11 } } }
        }
      }
    });

    var container = document.getElementById('track-table-container');
    if (container) {
      var html = '<h3>Track Details</h3><div class="table-wrap"><table><thead><tr><th>Track</th><th>Count</th><th>Share</th></tr></thead><tbody>';
      var total = values.reduce(function (s, v) { return s + v; }, 0);
      tracks.forEach(function (t) {
        var pct = (t[1] / total * 100).toFixed(1);
        html += '<tr><td>' + escHtml(t[0]) + '</td><td>' + t[1] + '</td><td>' + pct + '%</td></tr>';
      });
      html += '</tbody></table></div>';
      container.innerHTML = html;
    }
  }

  // ---- Analysis 3: Institutional Presence ----
  function renderInstitutionChart() {
    var canvas = document.getElementById('inst-chart');
    if (!canvas || !DATA || !DATA.top_affiliations) return;

    var affs = DATA.top_affiliations.slice(0, 20);
    var labels = affs.map(function (a) {
      var name = a[0];
      return name.length > 35 ? name.substring(0, 32) + '...' : name;
    });
    var values = affs.map(function (a) { return a[1]; });

    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Author-Presentations',
          data: values,
          backgroundColor: 'rgba(46, 125, 50, 0.65)',
          borderColor: 'rgba(46, 125, 50, 1)',
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Top 20 Institutions by Author-Presentation Count', font: { size: 14, weight: '600' } },
          tooltip: {
            callbacks: {
              title: function (ctx) { return affs[ctx[0].dataIndex][0]; }
            }
          }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
          y: { ticks: { font: { size: 11 } } }
        }
      }
    });

    // Yearly breakdown for top 5
    var container = document.getElementById('inst-yearly-container');
    if (container && FULL_DATA) {
      var top5 = affs.slice(0, 5).map(function (a) { return a[0]; });
      var years = getYears();

      var instYearCounts = {};
      top5.forEach(function (inst) { instYearCounts[inst] = {}; years.forEach(function (y) { instYearCounts[inst][y] = 0; }); });

      FULL_DATA.forEach(function (e) {
        var y = String(e.year);
        (e.affiliations || []).forEach(function (aff) {
          if (top5.indexOf(aff) !== -1) {
            instYearCounts[aff][y] = (instYearCounts[aff][y] || 0) + 1;
          }
        });
      });

      var html = '<h3>Top 5 Institutions Over Time</h3><div class="chart-container"><div style="height:350px;"><canvas id="inst-yearly-chart"></canvas></div></div>';
      container.innerHTML = html;

      var datasets = top5.map(function (inst, i) {
        return {
          label: inst,
          data: years.map(function (y) { return instYearCounts[inst][y] || 0; }),
          borderColor: COLORS[i],
          backgroundColor: COLORS[i] + '33',
          tension: 0.3,
          fill: false,
          pointRadius: 3,
        };
      });

      new Chart(document.getElementById('inst-yearly-chart').getContext('2d'), {
        type: 'line',
        data: { labels: years, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Top 5 Institutions: Presentations per Year', font: { size: 14, weight: '600' } },
            legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 15 } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  // ---- Analysis 4: Collaboration Patterns ----
  function renderCollaborationChart() {
    var canvas = document.getElementById('collab-chart');
    if (!canvas || !DATA) return;

    var years = getYears();
    var yearAuthors = {};
    years.forEach(function (y) { yearAuthors[y] = { total: 0, count: 0, solo: 0, duo: 0, multi: 0 }; });

    DATA.entries.forEach(function (e) {
      var y = String(e.y);
      var numAuthors = e.ac || 1;
      if (!yearAuthors[y]) return;
      yearAuthors[y].total += numAuthors;
      yearAuthors[y].count += 1;
      if (numAuthors === 1) yearAuthors[y].solo++;
      else if (numAuthors === 2) yearAuthors[y].duo++;
      else yearAuthors[y].multi++;
    });

    var avgAuthors = years.map(function (y) {
      return yearAuthors[y].count > 0 ? (yearAuthors[y].total / yearAuthors[y].count).toFixed(2) : 0;
    });

    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Avg Co-authors per Presentation',
          data: avgAuthors,
          borderColor: '#1565c0',
          backgroundColor: 'rgba(21, 101, 192, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#1565c0',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Average Co-authors per Presentation', font: { size: 14, weight: '600' } }
        },
        scales: {
          y: { grid: { color: 'rgba(0,0,0,0.06)' }, suggestedMin: 1, suggestedMax: 4 },
          x: { grid: { display: false } }
        }
      }
    });

    var distCanvas = document.getElementById('collab-dist-chart');
    if (distCanvas) {
      new Chart(distCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: years,
          datasets: [
            { label: 'Solo (1 author)', data: years.map(function (y) { return yearAuthors[y].solo; }), backgroundColor: 'rgba(198, 40, 40, 0.7)', borderRadius: 2 },
            { label: '2 Authors', data: years.map(function (y) { return yearAuthors[y].duo; }), backgroundColor: 'rgba(21, 101, 192, 0.7)', borderRadius: 2 },
            { label: '3+ Authors', data: years.map(function (y) { return yearAuthors[y].multi; }), backgroundColor: 'rgba(46, 125, 50, 0.7)', borderRadius: 2 },
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Collaboration Distribution by Year', font: { size: 14, weight: '600' } },
            legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 15 } }
          },
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } }
          }
        }
      });
    }
  }

  // ---- Analysis 5: Title Keyword Trends ----
  function renderKeywordChart() {
    var canvas = document.getElementById('keyword-chart');
    if (!canvas || !DATA) return;

    var STOP_WORDS = new Set([
      'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'shall', 'can', 'need', 'must', 'it', 'its', 'this', 'that', 'these',
      'those', 'with', 'from', 'by', 'as', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'under', 'about', 'against', 'not',
      'no', 'nor', 'but', 'so', 'if', 'then', 'than', 'too', 'very', 'just',
      'how', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'all',
      'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
      'only', 'own', 'same', 'also', 'their', 'they', 'them', 'we', 'our',
      'us', 'he', 'she', 'his', 'her', 'him', 'my', 'me', 'you', 'your',
      'up', 'out', 'over', 'off', 'down', 'new', 'one', 'two', 'among',
      'any', 'while', 'much', 'many', 'well', 'even',
      'still', 'yet', 'since', 'because', 'though', 'although', 'however',
      'whether', 'either', 'neither', 'per', 'toward', 'towards', 'across',
      'along', 'around', 'upon', 'within', 'without', 'beyond',
      'study', 'case', 'analysis', 'examining', 'understanding', 'exploring',
      'effects', 'effect', 'impact', 'impacts', 'using', 'based', 'evidence',
      'role', 'research', 'approach', 'review', 'perspectives', 'perspective',
      'implications', 'findings', 'results', 'data', 'model', 'framework',
    ]);

    var wordCounts = {};
    DATA.entries.forEach(function (e) {
      if (!e.t) return;
      var words = e.t.toLowerCase().replace(/[^a-z\s'-]/g, '').split(/\s+/);
      words.forEach(function (w) {
        w = w.replace(/^['-]+|['-]+$/g, '');
        if (w.length < 3 || STOP_WORDS.has(w)) return;
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });

    var topWords = Object.entries(wordCounts)
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 25);

    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: topWords.map(function (w) { return w[0]; }),
        datasets: [{
          label: 'Frequency',
          data: topWords.map(function (w) { return w[1]; }),
          backgroundColor: 'rgba(106, 27, 154, 0.6)',
          borderColor: 'rgba(106, 27, 154, 1)',
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Top 25 Title Keywords (All Years)', font: { size: 14, weight: '600' } }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
          y: { ticks: { font: { size: 11 } } }
        }
      }
    });

    // Keyword trends over time
    var container = document.getElementById('keyword-yearly-container');
    if (container) {
      var top5 = topWords.slice(0, 5).map(function (w) { return w[0]; });
      var years = getYears();

      var kwYearly = {};
      top5.forEach(function (w) { kwYearly[w] = {}; years.forEach(function (y) { kwYearly[w][y] = 0; }); });

      // Pre-compile regexes outside the loop
      var kwRegexes = top5.map(function (w) {
        return new RegExp('\\b' + w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'g');
      });

      DATA.entries.forEach(function (e) {
        if (!e.t) return;
        var y = String(e.y);
        var titleLower = e.t.toLowerCase();
        top5.forEach(function (w, i) {
          var matches = titleLower.match(kwRegexes[i]);
          if (matches) kwYearly[w][y] = (kwYearly[w][y] || 0) + matches.length;
        });
      });

      var html = '<h3>Top 5 Keywords Over Time (% of presentations)</h3><div class="chart-container"><div style="height:350px;"><canvas id="kw-yearly-chart"></canvas></div></div>';
      container.innerHTML = html;

      var datasets = top5.map(function (w, i) {
        return {
          label: w,
          data: years.map(function (y) {
            var total = DATA.year_stats[y].count;
            return total > 0 ? (kwYearly[w][y] / total * 100).toFixed(1) : 0;
          }),
          borderColor: COLORS[i],
          backgroundColor: COLORS[i] + '22',
          tension: 0.3,
          fill: false,
          pointRadius: 3,
        };
      });

      new Chart(document.getElementById('kw-yearly-chart').getContext('2d'), {
        type: 'line',
        data: { labels: years, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Keyword Prevalence Over Time', font: { size: 14, weight: '600' } },
            legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 15 } },
            tooltip: { callbacks: { label: function (ctx) { return ctx.dataset.label + ': ' + ctx.raw + '%'; } } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { callback: function (v) { return v + '%'; } } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();
