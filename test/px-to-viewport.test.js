// To run tests, run these commands from the project root:
// 1. `npm install`
// 2. `npm test`

/* global describe, it, expect */

const postcss = require('postcss');
const pxToViewport = require('..');
const basicCSS = '.rule { font-size: 15px }';
const { filterPropList } = require('../src/prop-list-matcher');

describe('px-to-viewport', function() {
  it('should work on the readme example', function () {
    const input = 'h1 { margin: 0 0 20px; font-size: 32px; line-height: 2; letter-spacing: 1px; }';
    const output = 'h1 { margin: 0 0 6.25vw; font-size: 10vw; line-height: 2; letter-spacing: 1px; }';
    const processed = postcss(pxToViewport()).process(input).css;

    expect(processed).toBe(output);
  });

  it('should replace the px unit with vw', function () {
    const processed = postcss(pxToViewport()).process(basicCSS).css;
    const expected = '.rule { font-size: 4.6875vw }';

    expect(processed).toBe(expected);
  });

  it('should handle < 1 values and values without a leading 0', function () {
    const rules = '.rule { margin: 0.5rem .5px -0.2px -.2em }';
    const expected = '.rule { margin: 0.5rem 0.15625vw -0.0625vw -.2em }';
    const options = {
        minPixelValue: 0
    };
    const processed = postcss(pxToViewport(options)).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should remain unitless if 0', function () {
    const expected = '.rule { font-size: 0px; font-size: 0; }';
    const processed = postcss(pxToViewport()).process(expected).css;

    expect(processed).toBe(expected);
  });

  it('should not add properties that already exist', function () {
    const expected = '.rule { font-size: 16px; font-size: 5vw; }';
    const processed = postcss(pxToViewport()).process(expected).css;

    expect(processed).toBe(expected);
  });

  it('should not replace units inside mediaQueries by default', function() {
    const expected = '@media (min-width: 500px) { .rule { font-size: 16px } }';
    const processed = postcss(pxToViewport()).process('@media (min-width: 500px) { .rule { font-size: 16px } }').css;

    expect(processed).toBe(expected);
  })
});

describe('value parsing', function() {
  it('should not replace values in double quotes or single quotes', function () {
    const options = {
        propList: ['*']
    };
    const rules = '.rule { content: \'16px\'; font-family: "16px"; font-size: 16px; }';
    const expected = '.rule { content: \'16px\'; font-family: "16px"; font-size: 5vw; }';
    const processed = postcss(pxToViewport(options)).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should not replace values in `url()`', function () {
    const rules = '.rule { background: url(16px.jpg); font-size: 16px; }';
    const expected = '.rule { background: url(16px.jpg); font-size: 5vw; }';
    const processed = postcss(pxToViewport()).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should not replace values with an uppercase P or X', function () {
    const rules = '.rule { margin: 12px calc(100% - 14PX); height: calc(100% - 20px); font-size: 12Px; line-height: 16px; }';
    const expected = '.rule { margin: 3.75vw calc(100% - 14PX); height: calc(100% - 6.25vw); font-size: 12Px; line-height: 5vw; }';
    const processed = postcss(pxToViewport()).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('unitToConvert', function() {
  it('should ignore non px values by default', function () {
    const expected = '.rule { font-size: 2em }';
    const processed = postcss(pxToViewport()).process(expected).css;

    expect(processed).toBe(expected);
  });

  it('should convert only values described in options', function () {
    const rules = '.rule { font-size: 5em; line-height: 2px }';
    const expected = '.rule { font-size: 1.5625vw; line-height: 2px }';
    const options = {
      unitToConvert: 'em'
    };
    const processed = postcss(pxToViewport(options)).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('viewportWidth', function() {
  it('should should replace using 320px by default', function() {
    const expected = '.rule { font-size: 4.6875vw }';
    const processed = postcss(pxToViewport()).process(basicCSS).css;

    expect(processed).toBe(expected);
  });

  it('should replace using viewportWidth from options', function() {
    const expected = '.rule { font-size: 3.125vw }';
    const options = {
      viewportWidth: 480
    };
    const processed = postcss(pxToViewport(options)).process(basicCSS).css;

    expect(processed).toBe(expected);
  })
});

describe('unitPrecision', function () {
  it('should replace using a decimal of 2 places', function () {
    const expected = '.rule { font-size: 4.69vw }';
    const options = {
        unitPrecision: 2
    };
    const processed = postcss(pxToViewport(options)).process(basicCSS).css;

    expect(processed).toBe(expected);
  });
});

describe('viewportUnit', function() {
  it('should replace using unit from options', function() {
    const rules = '.rule { margin-top: 15px }';
    const expected = '.rule { margin-top: 4.6875vh }';
    const options = {
        viewportUnit: 'vh'
    };
    const processed = postcss(pxToViewport(options)).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('fontViewportUnit', function() {
  it('should replace only font-size using unit from options', function() {
    const rules = '.rule { margin-top: 15px; font-size: 8px; }';
    const expected = '.rule { margin-top: 4.6875vw; font-size: 2.5vmax; }';
    const options = {
      fontViewportUnit: 'vmax'
    };
    const processed = postcss(pxToViewport(options)).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('selectorBlackList', function () {
  it('should ignore selectors in the selector black list', function () {
    const rules = '.rule { font-size: 15px } .rule2 { font-size: 15px }';
    const expected = '.rule { font-size: 4.6875vw } .rule2 { font-size: 15px }';
    const options = {
        selectorBlackList: ['.rule2']
    };
    const processed = postcss(pxToViewport(options)).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should ignore every selector with `body$`', function () {
    const rules = 'body { font-size: 16px; } .class-body$ { font-size: 16px; } .simple-class { font-size: 16px; }';
    const expected = 'body { font-size: 5vw; } .class-body$ { font-size: 16px; } .simple-class { font-size: 5vw; }';
    const options = {
        selectorBlackList: ['body$']
    };
    const processed = postcss(pxToViewport(options)).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should only ignore exactly `body`', function () {
    const rules = 'body { font-size: 16px; } .class-body { font-size: 16px; } .simple-class { font-size: 16px; }';
    const expected = 'body { font-size: 16px; } .class-body { font-size: 5vw; } .simple-class { font-size: 5vw; }';
    const options = {
        selectorBlackList: [/^body$/]
    };
    const processed = postcss(pxToViewport(options)).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('mediaQuery', function () {
  it('should replace px inside media queries if opts.mediaQuery', function() {
    const options = {
        mediaQuery: true
    };
    const processed = postcss(pxToViewport(options)).process('@media (min-width: 500px) { .rule { font-size: 16px } }').css;
    const expected = '@media (min-width: 500px) { .rule { font-size: 5vw } }';

    expect(processed).toBe(expected);
  });

  it('should not replace px inside media queries if not opts.mediaQuery', function() {
    const options = {
      mediaQuery: false
    };
    const processed = postcss(pxToViewport(options)).process('@media (min-width: 500px) { .rule { font-size: 16px } }').css;
    const expected = '@media (min-width: 500px) { .rule { font-size: 16px } }';

    expect(processed).toBe(expected);
  });

  it('should replace px inside media queries if it has params orientation landscape and landscape option', function() {
    const options = {
      mediaQuery: true,
      landscape: true
    };
    const processed = postcss(pxToViewport(options)).process('@media (orientation-landscape) and (min-width: 500px) { .rule { font-size: 16px } }').css;
    const expected = '@media (orientation-landscape) and (min-width: 500px) { .rule { font-size: 2.8169vw } }';

    expect(processed).toBe(expected);
  });
});

describe('propList', function () {
  it('should only replace properties in the prop list', function () {
    const css = '.rule { font-size: 16px; margin: 16px; margin-left: 5px; padding: 5px; padding-right: 16px }';
    const expected = '.rule { font-size: 5vw; margin: 5vw; margin-left: 5px; padding: 5px; padding-right: 5vw }';
    const options = {
        propList: ['*font*', 'margin*', '!margin-left', '*-right', 'pad']
    };
    const processed = postcss(pxToViewport(options)).process(css).css;

    expect(processed).toBe(expected);
  });

  it('should only replace properties in the prop list with wildcard', function () {
    const css = '.rule { font-size: 16px; margin: 16px; margin-left: 5px; padding: 5px; padding-right: 16px }';
    const expected = '.rule { font-size: 16px; margin: 5vw; margin-left: 5px; padding: 5px; padding-right: 16px }';
    const options = {
        propList: ['*', '!margin-left', '!*padding*', '!font*']
    };
    const processed = postcss(pxToViewport(options)).process(css).css;

    expect(processed).toBe(expected);
  });

  it('should replace all properties when prop list is not given', function () {
    const rules = '.rule { margin: 16px; font-size: 15px }';
    const expected = '.rule { margin: 5vw; font-size: 4.6875vw }';
    const processed = postcss(pxToViewport()).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('minPixelValue', function () {
  it('should not replace values below minPixelValue', function () {
    const options = {
        propWhiteList: [],
        minPixelValue: 2
    };
    const rules = '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }';
    const expected = '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }';
    const processed = postcss(pxToViewport(options)).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('exclude', function () {
  const rules = '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }';
  const covered = '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }';
  it('when using regex at the time, the style should not be overwritten.', function () {
    const options = {
      exclude: /\/node_modules\//
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/node_modules/main.css'
    }).css;

    expect(processed).toBe(rules);
  });

  it('when using regex at the time, the style should be overwritten.', function () {
    const options = {
      exclude: /\/node_modules\//
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/example/main.css'
    }).css;

    expect(processed).toBe(covered);
  });

  it('when using array at the time, the style should not be overwritten.', function () {
    const options = {
      exclude: [/\/node_modules\//, /\/exclude\//]
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/exclude/main.css'
    }).css;

    expect(processed).toBe(rules);
  });

  it('when using array at the time, the style should be overwritten.', function () {
    const options = {
      exclude: [/\/node_modules\//, /\/exclude\//]
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/example/main.css'
    }).css;

    expect(processed).toBe(covered);
  });
});

describe('include', function () {
  const rules = '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }';
  const covered = '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }';
  it('when using regex at the time, the style should not be overwritten.', function () {
    const options = {
      include: /\/mobile\//
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc/main.css'
    }).css;

    expect(processed).toBe(rules);
  });

  it('when using regex at the time, the style should be overwritten.', function () {
    const options = {
      include: /\/mobile\//
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/mobile/main.css'
    }).css;

    expect(processed).toBe(covered);
  });

  it('when using array at the time, the style should not be overwritten.', function () {
    const options = {
      include: [/\/flexible\//, /\/mobile\//]
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc/main.css'
    }).css;

    expect(processed).toBe(rules);
  });

  it('when using array at the time, the style should be overwritten.', function () {
    const options = {
      include: [/\/flexible\//, /\/mobile\//]
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/flexible/main.css'
    }).css;

    expect(processed).toBe(covered);
  });
});

describe('include-and-exclude', function () {
  const rules = '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }';
  const covered = '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }';

  it('when using regex at the time, the style should not be overwritten.', function () {
    const options = {
      include: /\/mobile\//,
      exclude: /\/not-transform\//
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/mobile/not-transform/main.css'
    }).css;

    expect(processed).toBe(rules);
  });

  it('when using regex at the time, the style should be overwritten.', function () {
    const options = {
      include: /\/mobile\//,
      exclude: /\/not-transform\//
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/mobile/style/main.css'
    }).css;

    expect(processed).toBe(covered);
  });

  it('when using array at the time, the style should not be overwritten.', function () {
    const options = {
      include: [/\/flexible\//, /\/mobile\//],
      exclude: [/\/not-transform\//, /pc/]
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/flexible/not-transform/main.css'
    }).css;

    expect(processed).toBe(rules);
  });

  it('when using regex at the time, the style should be overwritten.', function () {
    const options = {
      include: [/\/flexible\//, /\/mobile\//],
      exclude: [/\/not-transform\//, /pc/]
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/mobile/style/main.css'
    }).css;

    expect(processed).toBe(covered);
  });
});

describe('regex', function () {
  const rules = '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }';
  const covered = '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }';

  it('when using regex at the time, the style should not be overwritten.', function () {
    const options = {
      exclude: /pc/
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc-project/main.css'
    }).css;

    expect(processed).toBe(rules);
  });

  it('when using regex at the time, the style should be overwritten.', function () {
    const options = {
      exclude: /\/pc\//
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc-project/main.css'
    }).css;

    expect(processed).toBe(covered);
  });

  it('when using regex at the time, the style should not be overwritten.', function () {
    const options = {
      include: /\/pc\//
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc-project/main.css'
    }).css;

    expect(processed).toBe(rules);
  });

  it('when using regex at the time, the style should be overwritten.', function () {
    const options = {
      include: /pc/
    };
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc-project/main.css'
    }).css;

    expect(processed).toBe(covered);
  });
});

describe('replace', function () {
  it('should leave fallback pixel unit with root em value', function () {
    const options = {
      replace: false
    };
    const processed = postcss(pxToViewport(options)).process(basicCSS).css;
    const expected = '.rule { font-size: 15px; font-size: 4.6875vw }';

    expect(processed).toBe(expected);
  });
});

describe('filter-prop-list', function () {
  it('should find "exact" matches from propList', function () {
    const propList = ['font-size', 'margin', '!padding', '*border*', '*', '*y', '!*font*'];
    const expected = 'font-size,margin';
    expect(filterPropList.exact(propList).join()).toBe(expected);
  });

  it('should find "contain" matches from propList and reduce to string', function () {
    const propList = ['font-size', '*margin*', '!padding', '*border*', '*', '*y', '!*font*'];
    const expected = 'margin,border';
    expect(filterPropList.contain(propList).join()).toBe(expected);
  });

  it('should find "start" matches from propList and reduce to string', function () {
    const propList = ['font-size', '*margin*', '!padding', 'border*', '*', '*y', '!*font*'];
    const expected = 'border';
    expect(filterPropList.startWith(propList).join()).toBe(expected);
  });

  it('should find "end" matches from propList and reduce to string', function () {
    const propList = ['font-size', '*margin*', '!padding', 'border*', '*', '*y', '!*font*'];
    const expected = 'y';
    expect(filterPropList.endWith(propList).join()).toBe(expected);
  });

  it('should find "not" matches from propList and reduce to string', function () {
    const propList = ['font-size', '*margin*', '!padding', 'border*', '*', '*y', '!*font*'];
    const expected = 'padding';
    expect(filterPropList.notExact(propList).join()).toBe(expected);
  });

  it('should find "not contain" matches from propList and reduce to string', function () {
    const propList = ['font-size', '*margin*', '!padding', '!border*', '*', '*y', '!*font*'];
    const expected = 'font';
    expect(filterPropList.notContain(propList).join()).toBe(expected);
  });

  it('should find "not start" matches from propList and reduce to string', function () {
    const propList = ['font-size', '*margin*', '!padding', '!border*', '*', '*y', '!*font*'];
    const expected = 'border';
    expect(filterPropList.notStartWith(propList).join()).toBe(expected);
  });

  it('should find "not end" matches from propList and reduce to string', function () {
    const propList = ['font-size', '*margin*', '!padding', '!border*', '*', '!*y', '!*font*'];
    const expected = 'y';
    expect(filterPropList.notEndWith(propList).join()).toBe(expected);
  });
});

describe('landscape', function() {
  it('should add landscape atRule', function() {
    const css = '.rule { font-size: 16px; margin: 16px; margin-left: 5px; padding: 5px; padding-right: 16px }';
    const expected = '.rule { font-size: 5vw; margin: 5vw; margin-left: 1.5625vw; padding: 1.5625vw; padding-right: 5vw }@media (orientation: landscape) {.rule { font-size: 2.8169vw; margin: 2.8169vw; margin-left: 0.88028vw; padding: 0.88028vw; padding-right: 2.8169vw } }';
    const options = {
      landscape: true
    };
    const processed = postcss(pxToViewport(options)).process(css).css;

    expect(processed).toBe(expected);
  });

  it('should add landscape atRule with specified landscapeUnits', function() {
    const css = '.rule { font-size: 16px; margin: 16px; margin-left: 5px; padding: 5px; padding-right: 16px }';
    const expected = '.rule { font-size: 5vw; margin: 5vw; margin-left: 1.5625vw; padding: 1.5625vw; padding-right: 5vw }@media (orientation: landscape) {.rule { font-size: 2.8169vh; margin: 2.8169vh; margin-left: 0.88028vh; padding: 0.88028vh; padding-right: 2.8169vh } }';
    const options = {
      landscape: true,
      landscapeUnit: 'vh'
    };
    const processed = postcss(pxToViewport(options)).process(css).css;

    expect(processed).toBe(expected);
  });

  it('should not add landscape atRule in mediaQueries', function() {
    const css = '@media (min-width: 500px) { .rule { font-size: 16px } }';
    const expected = '@media (min-width: 500px) { .rule { font-size: 5vw } }';
    const options = {
      landscape: true,
      mediaQuery: true
    };
    const processed = postcss(pxToViewport(options)).process(css).css;

    expect(processed).toBe(expected);
  });

  it('should not replace values inside landscape atRule', function() {
    const options = {
      replace: false,
      landscape: true
    };
    const processed = postcss(pxToViewport(options)).process(basicCSS).css;
    const expected = '.rule { font-size: 15px; font-size: 4.6875vw }@media (orientation: landscape) {.rule { font-size: 2.64085vw } }';

    expect(processed).toBe(expected);
  });

  it('should add landscape atRule with specified landscapeWidth', function() {
    const options = {
      landscape: true,
      landscapeWidth: 768
    };
    const processed = postcss(pxToViewport(options)).process(basicCSS).css;
    const expected = '.rule { font-size: 4.6875vw }@media (orientation: landscape) {.rule { font-size: 1.95313vw } }';

    expect(processed).toBe(expected);
  });

  it('should not add landscape atRule if it has no nodes', function() {
    const css = '.rule { font-size: 15vw }';
    const options = {
      landscape: true
    };
    const processed = postcss(pxToViewport(options)).process(css).css;
    const expected = '.rule { font-size: 15vw }';

    expect(processed).toBe(expected);
  });
});

describe('/* px-to-viewport-ignore */ & /* px-to-viewport-ignore-next */', function() {
  it('should ignore right-commented', function() {
    const css = '.rule { font-size: 15px; /* simple comment */ width: 100px; /* px-to-viewport-ignore */ height: 50px; }';
    const expected = '.rule { font-size: 4.6875vw; /* simple comment */ width: 100px; height: 15.625vw; }';

    const processed = postcss(pxToViewport()).process(css).css;

    expect(processed).toBe(expected);
  });

  it('should ignore right-commented in multiline-css', function() {
    const css = '.rule {\n  font-size: 15px;\n  width: 100px; /*px-to-viewport-ignore*/\n  height: 50px;\n}';
    const expected = '.rule {\n  font-size: 4.6875vw;\n  width: 100px;\n  height: 15.625vw;\n}';

    const processed = postcss(pxToViewport()).process(css).css;

    expect(processed).toBe(expected);
  });

  it('should ignore before-commented in multiline-css', function() {
    const css = '.rule {\n  font-size: 15px;\n  /*px-to-viewport-ignore-next*/\n  width: 100px;\n  /*px-to-viewport-ignore*/\n  height: 50px;\n}';
    const expected = '.rule {\n  font-size: 4.6875vw;\n  width: 100px;\n  /*px-to-viewport-ignore*/\n  height: 15.625vw;\n}';

    const processed = postcss(pxToViewport()).process(css).css;

    expect(processed).toBe(expected);
  });
});
