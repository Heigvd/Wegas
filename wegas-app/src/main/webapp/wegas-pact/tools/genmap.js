function genMap(levels) {
    var i,
        ret = [],
        count = 0,
        subinc,
        stage,
        j;

    for (var i in levels) {
        var inc = count * 100,
            level = count + 1;
        ret.push({
            type: 'Text',
            content: i.toUpperCase(),
            plugins: [
                {
                    fn: 'CSSPosition',
                    cfg: {
                        styles: {
                            position: 'absolute',
                            top: inc + 80 + 'px',
                            left: '50px',
                        },
                    },
                },
                {
                    fn: 'CSSSize',
                    cfg: {
                        styles: {
                            position: 'absolute',
                            width: '500px',
                            height: '100px',
                        },
                    },
                },
                {
                    fn: 'CSSText',
                    cfg: {
                        styles: {
                            color: 'white',
                            fontSize: '2em',
                        },
                    },
                },
                {
                    fn: 'CSSStyles',
                    cfg: {
                        styles: {
                            fontFamily: 'KG Ways to Say Goodbye',
                        },
                    },
                },
            ],
        });
        for (j = 0; j < levels[i]; j += 1) {
            stage = '' + (j + 1);
            subinc = 70 * j;
            ret.push({
                type: 'Button',
                label: 'STAGE<br /> ' + level + '.' + stage,
                cssClass: 'proggame-levelselection-button',
                plugins: [
                    {
                        fn: 'ConditionalDisable',
                        cfg: {
                            condition: {
                                '@class': 'Script',
                                content:
                                    'Variable.find(gameModel, "currentLevel").getValue(self)<' +
                                    level +
                                    stage,
                                language: 'JavaScript',
                            },
                        },
                    },
                    {
                        fn: 'OpenPageAction',
                        cfg: {
                            subpageId: level + stage,
                            targetEvent: 'click',
                            targetPageLoaderId: 'maindisplayarea',
                        },
                    },
                    {
                        fn: 'CSSPosition',
                        cfg: {
                            styles: {
                                position: 'absolute',
                                top: 110 + inc + 'px',
                                left: 50 + subinc + 'px',
                            },
                        },
                    },
                    {
                        fn: 'CSSSize',
                        cfg: {
                            styles: {
                                position: 'absolute',
                                width: '60px',
                                height: '60px',
                            },
                        },
                    },
                ],
            });
        }
        count += 1;
    }
    return ret;
}
JSON.stringify(
    genMap({
        'Level 1: Moving around': 3,
        'Level 2: Variables': 4,
        'Level 3: Functions': 1,
    })
);
