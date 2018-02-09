function visualize() {
  var qResult = document.getElementById('q-result-input').value.trim();
  var gameMap = document.getElementById('game-map-input').value.trim();

  if (qResult.length === 0) {
    alert('Please enter "Q result"');
    return;
  }
  if (gameMap.length === 0) {
    alert('Please enter "Game Map"');
    return;
  }

  var gmRegex = /^\s*\[((\s*"(-|G|X|R)+",{0,1})+)\s*\]\s*$/i;
  if (!gmRegex.test(gameMap)) {
    alert('Format of "Game Map" is incorrect');
    return;
  }
  gameMap = gameMap
    .match(gmRegex)[1]
    .split(',')
    .map(function(x) {
      x = x.trim();
      return x.substring(1, x.length - 1);
    });

  var qrRegex = /^\s*\[((\[(\[(\s*(\-){0,1}\d+.\d*){4}\s*\]\s*)+\]\s*)+)\]\s*$/i;
  var qrRegexRow = /(\[(\s*(\-){0,1}\d+.\d*){4}\s*\]\s*)+/gi;
  var qrRegexCol = /\[((\s*(\-){0,1}\d+.\d*){4})\s*\]\s*/gi;
  if (!qrRegex.test(qResult)) {
    alert('Format of "Q result" is incorrect');
    return;
  }
  qResult = qResult.match(qrRegex)[1];

  var qResultData = [];
  var match;
  while ((match = qrRegexRow.exec(qResult)) !== null) {
    match = match[0];
    var matchCol;
    var dataRow = [];
    while ((matchCol = qrRegexCol.exec(match)) != null) {
      matchCol = matchCol[1].trim();
      var dataCol = matchCol
        .split(' ')
        .filter(function(x) {
          return x.length;
        })
        .map(function(x) {
          return parseFloat(x);
        });
      dataRow.push(dataCol);
    }
    qResultData.push(dataRow);
  }

  if (gameMap.length === 0) {
    alert('"Game Map" has no data');
    return;
  }

  if (qResultData.length === 0) {
    alert('"Q Result" has no data');
    return;
  }

  if (
    gameMap.length !== qResultData.length ||
    gameMap[0].length !== qResultData[0].length
  ) {
    var txt = 'Data dimension of "Q Result" ';
    txt += '(' + qResultData.length + ',' + qResultData[0].length + ') ';
    txt += 'is not the same with "Game Map" ';
    txt += '(' + gameMap.length + ',' + gameMap[0].length + ') ';
    alert(txt);
    return;
  }

  drawQMap(gameMap, qResultData);
}

function drawQMap(map, data) {
  var dimY = map.length;
  var dimX = map[0].length;
  var size = 100;

  document.getElementById('draw-shapes').innerHTML = '';

  var svg = d3
    .select('#draw-shapes')
    .attr('width', size * dimX + 4)
    .attr('height', size * dimY + 4);

  var trianglePoints = [
    [[size, 0], [size / 2, size / 2], [size, size]], // Right
    [[0, 0], [size / 2, size / 2], [0, size]], // Left
    [[0, size], [size / 2, size / 2], [size, size]], // Down
    [[0, 0], [size / 2, size / 2], [size, 0]] // Up
  ];
  var textPos = [
    [size * 5 / 6, size / 2], // Left
    [size * 1 / 6, size / 2], // Right
    [size / 2, size * 5 / 6], // Down
    [size / 2, size * 1 / 6] // Up
  ];

  var greenCol = d3.rgb(39, 209, 23);
  var redCol = d3.rgb(255, 84, 84);
  var greyCol = d3.rgb(178, 178, 178);

  for (var i = 0; i < dimY; i++) {
    for (var j = 0; j < dimX; j++) {
      var x = 2 + size * j;
      var y = 2 + size * i;

      var g = svg.append('g');

      g
        .append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('height', 100)
        .attr('width', 100)
        .style('fill', function() {
          switch (map[i][j]) {
            case 'R':
              return redCol;
            case 'G':
              return greenCol;
            case 'X':
              return greyCol;
            default:
              return 'none';
          }
        })
        .style('stroke', 'black');

      if (map[i][j] == '-') {
        g
          .selectAll('polygon')
          .data(data[i][j])
          .enter()
          .append('polygon')
          .attr('points', function(d, i) {
            return trianglePoints[i]
              .map(function(dd) {
                return [x + dd[0], y + dd[1]].join(',');
              })
              .join(' ');
          })
          .attr('stroke', 'black')
          .attr('fill', function(d) {
            if (d > 0) {
              return greenCol;
            } else if (d === 0) {
              return 'none';
            } else if (d < 0) {
              return redCol;
            }
          })
          .attr('fill-opacity', function(d) {
            if (d > 0) {
              return Math.min(1, d / 1);
            } else {
              return Math.min(1, -d / 1);
            }
          });

        g
          .selectAll('text')
          .data(data[i][j])
          .enter()
          .append('text')
          .attr('x', function(d, i) {
            return x + textPos[i][0];
          })
          .attr('y', function(d, i) {
            return y + textPos[i][1] + 6;
          })
          .attr('text-anchor', 'middle')
          .attr('font-size', '12')
          .text(function(d) {
            return parseInt(d * 100) / 100;
          });
      } else {
        var text = '';

        switch (map[i][j]) {
          case 'G':
            text = '+1.0';
            break;
          case 'R':
            text = '-1.0';
            break;
        }

        g
          .append('text')
          .text(text)
          .attr('x', function() {
            return x + size / 2;
          })
          .attr('y', function() {
            return y + size / 2 + 10;
          })
          .attr('text-anchor', 'middle')
          .attr('font-size', '20');
      }
    }
  }
}

drawQMap(
  ['---G', '-X-R', '----'],
  [
    [
      [0.27804415, 0, 0.24590809, 0],
      [0.31053457, 0.22674864, 0, 0],
      [0.468559, 0.13922171, 0.13830673, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0.23597266, 0.26149207],
      [0, 0, 0, 0],
      [-0.99882098, 0, 0.06537061, 0.28367347],
      [0, 0, 0, 0]
    ],
    [
      [0.24423518, 0, 0, 0.24872532],
      [0.25680612, 0.23622274, 0, 0],
      [0.24196277, 0.24233745, 0, 0.26952749],
      [0, 0.25503127, 0, -1]
    ]
  ]
);

document.getElementById('q-result-input').value =
  '[[[ 0.27804415  0.          0.24590809  0.        ]' +
  '[ 0.31053457  0.22674864  0.          0.        ]' +
  '[ 0.468559    0.13922171  0.13830673  0.        ]' +
  '[ 0.          0.          0.          0.        ]]' +
  '[[ 0.          0.          0.23597266  0.26149207]' +
  '[ 0.          0.          0.          0.        ]' +
  '[-0.99882098  0.          0.06537061  0.28367347]' +
  '[ 0.          0.          0.          0.        ]]' +
  '[[ 0.24423518  0.          0.          0.24872532]' +
  '[ 0.25680612  0.23622274  0.          0.        ]' +
  '[ 0.24196277  0.24233745  0.          0.26952749]' +
  '[ 0.          0.25503127  0.         -1.        ]]]';

document.getElementById('game-map-input').value = '["---G","-X-R","----"]';
