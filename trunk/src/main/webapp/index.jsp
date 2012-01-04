<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
   "http://www.w3.org/TR/html4/loose.dtd">

<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>JSP Page</title>
    </head>
    <body>
        <h1>Hello World!</h1>

        <em>POST the folowing to /rs/gm</em>
        <pre>
{
    "@class": "GameModel",
    "name": "TestModel2",
    "types": [
        {
            "@class": "IntegerT",
            "name": "Positive",
            "min": 1,
            "max": null,
            "default": 1
        },
        {
            "@class": "IntegerT",
            "name": "IntPercent",
            "min": 0,
            "max": 100,
            "default": 0
        },
        {
            "@class": "DoubleT",
            "name": "Dbl",
            "min": null,
            "max": null,
            "default": 0
        },
        {
            "@class": "DoubleT",
            "name": "DblPercent",
            "min": 0,
            "max": 1,
            "default": 0
        },
        {
            "@class": "StringT",
            "name": "String",
            "pattern": null
        },
        {
            "@class": "StringT",
            "name": "Token",
            "pattern": "^\\w+$"
        },
        {
            "@class": "BooleanT",
            "name": "Bool"
        },
        {
            "@class": "TextT",
            "name": "Text"
        },
        {
            "@class": "MediaT",
            "name": "Video",
            "mediaType": "VIDEO"
        },
        {
            "@class": "EnumT",
            "name": "Grade",
            "items": [
                {
                    "@class": "EnumItem",
                    "name": "Apprentice"
                },
                {
                    "@class": "EnumItem",
                    "name": "Junior"
                },
                {
                    "@class": "EnumItem",
                    "name": "Senior"
                },
                {
                    "@class": "EnumItem",
                    "name": "Expert"
                }
            ]
        },
        {
            "@class": "EnumT",
            "name": "DaysOfWeek",
            "items": [
                {
                    "@class": "EnumItem",
                    "name": "Monday"
                },
                {
                    "@class": "EnumItem",
                    "name": "Tuesday"
                },
                {
                    "@class": "EnumItem",
                    "name": "Wednesday"
                },
                {
                    "@class": "EnumItem",
                    "name": "Thursday"
                },
                {
                    "@class": "EnumItem",
                    "name": "Friday"
                },
                {
                    "@class": "EnumItem",
                    "name": "Saturday"
                },
                {
                    "@class": "EnumItem",
                    "name": "Sunday"
                }
            ]
        },
        {
            "@class": "ComplexT",
            "name": "People",
            "variableDescriptors": [
                {
                    "@class": "VarDesc",
                    "name": "name",
                    "type": "String",
                    "cardinality": {
                        "@class": "One"
                    }
                },
                {
                    "@class": "VarDesc",
                    "name": "surname",
                    "type": "String",
                    "cardinality": {
                        "@class": "One"
                    }
                },
                {
                    "@class": "VarDesc",
                    "name": "age",
                    "type": "Positive",
                    "cardinality": {
                        "@class": "One"
                    }
                },
                {
                    "@class": "VarDesc",
                    "name": "activityRate",
                    "type": "IntPercent",
                    "cardinality": {
                        "@class": "One"
                    }
                },
                {
                    "@class": "VarDesc",
                    "name": "grade",
                    "type": "Grade",
                    "cardinality": {
                        "@class": "One"
                    }
                }
            ]
        }
    ],
    "variableDescriptors": [
        {
            "@class": "VarDesc",
            "name": "mApproval",
            "type": "IntPercent",
            "cardinality": {
                "@class": "One"
            }
        },
        {
            "@class": "VarDesc",
            "name": "weekSales",
            "type": "Dbl",
            "cardinality": {
                "@class": "Enum",
                "enum": "DaysOfWeek"
            }
        },
        {
            "@class": "VarDesc",
            "name": "test",
            "type": "Dbl",
            "cardinality": {
                "@class": "Unbounded"
            }
        },
        {
            "@class": "VarDesc",
            "name": "people",
            "type": "People",
            "cardinality": {
                "@class": "Unbounded"
            }
        }
    ],
    "variableInstances": [
        {
            "@class": "Var",
            "name": "test"
        },
        {
            "@class": "Var",
            "name": "people",
            "instances": [
                {
                    "@class": "ComplexI",
                    "alias": "James",
                    "active": false,
                    "cond": null,
                    "variableInstances": [
                        {
                            "@class": "Var",
                            "name": "name",
                            "instances": [
                                {
                                    "@class": "StringI",
                                    "v": "Jean",
                                    "alias": "1"
                                }
                            ]
                        },
                        {
                            "@class": "Var",
                            "name": "surname",
                            "instances": [
                                {
                                    "@class": "StringI",
                                    "v": "Jean",
                                    "alias": "1"
                                }
                            ]
                        },
                        {
                            "@class": "Var",
                            "name": "age",
                            "instances": [
                                {
                                    "@class": "IntegerI",
                                    "v": 30,
                                    "alias": "1"
                                }
                            ]
                        },
                        {
                            "@class": "Var",
                            "name": "activityRate",
                            "instances": [
                                {
                                    "@class": "IntegerI",
                                    "v": 80,
                                    "alias": "1"
                                }
                            ]
                        },
                        {
                            "@class": "Var",
                            "name": "grade",
                            "instances": [
                                {
                                    "@class": "EnumI",
                                    "v": "Senior",
                                    "alias": "1"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "@class": "Var",
            "name": "mApproval",
            "instances": [
                {
                    "@class": "IntegerI",
                    "v": 0,
                    "alias": "1"
                }
            ]
        },
        {
            "@class": "Var",
            "name": "weekSales",
            "instances": [
                {
                    "@class": "DoubleI",
                    "v": 1240,
                    "alias": "Monday"
                },
                {
                    "@class": "DoubleI",
                    "v": 130,
                    "alias": "Tuesday"
                },
                {
                    "@class": "DoubleI",
                    "v": 12435,
                    "alias": "Wednesday"
                },
                {
                    "@class": "DoubleI",
                    "v": 15.3,
                    "alias": "Thursday"
                },
                {
                    "@class": "DoubleI",
                    "v": 88,
                    "alias": "Friday"
                },
                {
                    "@class": "DoubleI",
                    "v": 1000,
                    "alias": "Saturday"
                },
                {
                    "@class": "DoubleI",
                    "v": 10,
                    "alias": "Sunday"
                }
            ]
        }
    ]
}
        </pre>
    </body>
</html>
