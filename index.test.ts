import {
    findDtsName,
    getNpmInfo,
    dtToNpmName,
    toErrorKind,
    dtsCritic,
    checkSource,
    ErrorKind } from "./index";

function suite(description: string, tests: { [s: string]: () => void; }) {
    describe(description, () => {
        for (const k in tests) {
            test(k, tests[k], 10 * 1000);
        }
    });
}

suite("findDtsName", {
    absolutePath() {
        expect(findDtsName("~/dt/types/jquery/index.d.ts")).toBe("jquery");
    },
    relativePath() {
        expect(findDtsName("jquery/index.d.ts")).toBe("jquery");
    },
    currentDirectory() {
        expect(findDtsName("index.d.ts")).toBe("dts-critic");
    },
    relativeCurrentDirectory() {
        expect(findDtsName("./index.d.ts")).toBe("dts-critic");
    },
    emptyDirectory() {
        expect(findDtsName("")).toBe("dts-critic");
    },
});
suite("getNpmInfo", {
    nonNpm() {
        expect(getNpmInfo("parseltongue")).toEqual({ isNpm: false });
    },
    npm() {
        expect(getNpmInfo("typescript")).toEqual({
            isNpm: true,
            versions: expect.arrayContaining(["3.7.5"]),
            tags: expect.objectContaining({ latest: expect.stringContaining("") }),
        });
    },
});
suite("dtToNpmName", {
    nonScoped() {
        expect(dtToNpmName("content-type")).toBe("content-type");
    },
    scoped() {
        expect(dtToNpmName("babel__core")).toBe("@babel/core");
    },
});
suite("toErrorKind", {
    existent() {
        expect(toErrorKind("NoMatchingNpmPackage")).toBe(ErrorKind.NoMatchingNpmPackage);
    },
    existentDifferentCase() {
        expect(toErrorKind("noMatchingNPMVersion")).toBe(ErrorKind.NoMatchingNpmVersion);
    },
    nonexistent() {
        expect(toErrorKind("FakeError")).toBe(undefined);
    }
});
suite("checkSource", {
    noErrors() {
        expect(checkSource(
            "noErrors",
            "testsource/noErrors.d.ts",
            "testsource/noErrors.js",
            false,
        )).toEqual([]);
    },
    missingJsProperty() {
        expect(checkSource(
            "missingJsProperty",
            "testsource/missingJsProperty.d.ts",
            "testsource/missingJsProperty.js",
            false,
        )).toEqual(expect.arrayContaining([
            {
                kind: ErrorKind.JsPropertyNotInDts,
                message: `The declaration doesn't match the JavaScript module 'missingJsProperty'. Reason:
The JavaScript module exports a property named 'foo', which is missing from the declaration module.`
            }
        ]));
    },
    missingDtsProperty() {
        expect(checkSource(
            "missingDtsProperty",
            "testsource/missingDtsProperty.d.ts",
            "testsource/missingDtsProperty.js",
            false,
        )).toEqual(expect.arrayContaining([
            {
                kind: ErrorKind.DtsPropertyNotInJs,
                message: `The declaration doesn't match the JavaScript module 'missingDtsProperty'. Reason:
The declaration module exports a property named 'foo', which is missing from the JavaScript module.`,
                position: {
                    start: 67,
                    length: 11,
                },
            }
        ]));
    },
    missingDefaultExport() {
        expect(checkSource(
            "missingDefault",
            "testsource/missingDefault.d.ts",
            "testsource/missingDefault.js",
            false,
        )).toEqual(expect.arrayContaining([
            {
                kind: ErrorKind.NoDefaultExport,
                message: `The declaration doesn't match the JavaScript module 'missingDefault'. Reason:
The declaration specifies 'export default' but the JavaScript source does not mention 'default' anywhere.

The most common way to resolve this error is to use 'export =' syntax instead of 'export default'.
To learn more about 'export =' syntax, see https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require.`,
                position: {
                    start: 0,
                    length: 32,
                },
            }
        ]));
    },
    missingJsSignatureExportEquals() {
        expect(checkSource(
            "missingJsSignatureExportEquals",
            "testsource/missingJsSignatureExportEquals.d.ts",
            "testsource/missingJsSignatureExportEquals.js",
            false,
        )).toEqual(expect.arrayContaining([
            {
                kind: ErrorKind.JsCallable,
                message: `The declaration doesn't match the JavaScript module 'missingJsSignatureExportEquals'. Reason:
The JavaScript module can be called or constructed, but the declaration module cannot.`,
            }
        ]));
    },
    missingJsSignatureNoExportEquals() {
        expect(checkSource(
            "missingJsSignatureNoExportEquals",
            "testsource/missingJsSignatureNoExportEquals.d.ts",
            "testsource/missingJsSignatureNoExportEquals.js",
            false,
        )).toEqual(expect.arrayContaining([
            {
                kind: ErrorKind.JsCallable,
                message: `The declaration doesn't match the JavaScript module 'missingJsSignatureNoExportEquals'. Reason:
The JavaScript module can be called or constructed, but the declaration module cannot.

The most common way to resolve this error is to use 'export =' syntax.
To learn more about 'export =' syntax, see https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require.`,
            }
        ]));
    },
    missingDtsSignature() {
        expect(checkSource(
            "missingDtsSignature",
            "testsource/missingDtsSignature.d.ts",
            "testsource/missingDtsSignature.js",
            false,
        )).toEqual(expect.arrayContaining([
            {
                kind: ErrorKind.DtsCallable,
                message: `The declaration doesn't match the JavaScript module 'missingDtsSignature'. Reason:
The declaration module can be called or constructed, but the JavaScript module cannot.`,
            }
        ]));
    },
    missingExportEquals() {
        expect(checkSource(
            "missingExportEquals",
            "testsource/missingExportEquals.d.ts",
            "testsource/missingExportEquals.js",
            false,
        )).toEqual(expect.arrayContaining([
            {
                kind: ErrorKind.NeedsExportEquals,
                message: `The declaration doesn't match the JavaScript module 'missingExportEquals'. Reason:
The declaration should use 'export =' syntax because the JavaScript source uses 'module.exports =' syntax and 'module.exports' can be called or constructed.

To learn more about 'export =' syntax, see https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require.`,
            }
        ]));
    },
});
suite("dtsCritic", {
    noErrors() {
        expect(dtsCritic("testsource/dts-critic.d.ts", "testsource/dts-critic.js")).toEqual([]);
    },
    noMatchingNpmPackage() {
        expect(dtsCritic("testsource/parseltongue.d.ts")).toEqual([
            {
                kind: ErrorKind.NoMatchingNpmPackage,
                message: `Declaration file must have a matching npm package.
To resolve this error, either:
1. Change the name to match an npm package.
2. Add a Definitely Typed header with the first line


// Type definitions for non-npm package parseltongue-browser

Add -browser to the end of your name to make sure it doesn't conflict with existing npm packages.`,
            },
        ]);
    },
    noMatchingNpmVersion() {
        expect(dtsCritic("testsource/typescript.d.ts")).toEqual([
            {
                kind: ErrorKind.NoMatchingNpmVersion,
                message: expect.stringContaining(`The types for 'typescript' must match a version that exists on npm.
You should copy the major and minor version from the package on npm.`),
            },
        ]);
    },
    nonNpmHasMatchingPackage() {
        expect(dtsCritic("testsource/tslib.d.ts")).toEqual([
            {
                kind: ErrorKind.NonNpmHasMatchingPackage,
                message: `The non-npm package 'tslib' conflicts with the existing npm package 'tslib'.
Try adding -browser to the end of the name to get

tslib-browser`,
            },
        ]);
    }
});