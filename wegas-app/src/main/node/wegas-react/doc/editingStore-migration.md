# `editingStore` → react-redux — notes & trace

Context notes for the migration of `data/Stores/editingStore.ts` into the single
react-redux store (`src/store`). Step-by-step instructions live in
[`editingStore-migration-plan.md`](./editingStore-migration-plan.md).

---

## 1. What `editingStore` was

```ts
// data/Reducer/editingState.ts:140
interface EditingState {
  editing?: Edition;      // what the editor currently has open
  events: WegasEvent[];   // the editor's error / notification log
}
```

Split out of the old global store in `b1e7cfbf5` (2022-03-30, *"Extracting edition
state from global store => phat refactoring!"*). The reason is structural: the old
store holds **data** (`variableDescriptors`, `variableInstances`, `global`, `pages`,
`players`, `teams`), editing state is **UI** state that changes on every keystroke.
Since `useAnyStore` re-runs *every* subscriber's selector on *every* action, typing
in a form used to wake up the whole variable tree.

### `editing` — three kinds of edition

| `type` | Meaning |
|---|---|
| `Variable` / `VariableFSM` | an existing descriptor is open (`VariableFSM` = in the state-machine editor) |
| `VariableCreate` | a variable that doesn't exist yet (`@class`, `parentId`, `subtype`) |
| `File` | a file's metadata is open, plus a `cb` to call after save |

Plus per-session form bookkeeping: `newEntity` (unsaved form content),
`highlight` (flash the form), `instanceEditing` (instance side-panel + saved flag).

### `events`

Append-only `WegasEvent[]`, each stamped `timestamp` + `unread`. Fed by
`manageResponseHandler` (server events), `editorErrorEvent()`, and websocket pushes.
Read only by the notification bell (`Header.tsx:122`) — see §4.

---

## 2. The four roles it played

| Role | What | After migration |
|---|---|---|
| **A** — current edition | drives which form/panel is shown | `store/slices/edition.ts` |
| **B** — event log | notification bell | `store/slices/editorEvents.ts` |
| **C** — thunk host | ~60 unrelated `editingStore.dispatch(thunk)` sites | dissolves |
| **D** — scoped instances | `editingStoreFactory()` × 2 | `store/localEdition.ts` (React-local) |

### Role C — why it existed, and why it dissolves

Every server-touching thunk ends with:

```ts
.then(res => dispatch(manageResponseHandler(res, dispatch, getState())))
```

`getState()` is passed in for exactly two features inside `manageResponseHandler`
(`data/actions.ts:155-189`):

1. **close-on-delete** — the entity you had open was deleted server-side → close the form
2. **auto-reselect-on-update** — it came back with a new `version` → re-dispatch
   `edit(freshEntity)` so the next save doesn't conflict

So every thunk had to be typed `EditingThunkResult`, so every caller had to dispatch
through `editingStore` — including player-side widgets where no editor exists
(`Inputs/Number.component.tsx:68`, `Outputs/Inbox.tsx:161`, `Inputs/Validate.tsx:177`).

The tell that this was accidental: those thunks declare their state as `EditingState`
yet their first line is `store.getState().global.currentGameModelId` — the *other*
store, reached by import. `EditingThunkResult` was a lie of convenience.

**One store ⇒ one `getState()` ⇒ nothing left to host.** No separate fix needed.

### Role D — why local instances are genuinely needed

Not "a widget needs an editor" but **two simultaneous, independent selections the
user can see at once**:

```ts
// css/classes.ts:242-247
export const localSelection  = css({ border: '1px dashed ' + themeVar.colors.PrimaryColor });
export const globalSelection = css({ backgroundColor: themeVar.colors.HeaderColor });
```

```tsx
// Editor/Components/Variable/CTree.tsx:344-345 — both, on the same node
[globalSelection]: editing,       // open in the main editor
[localSelection]:  localEditing,  // open in this widget's side form
```

- **click** → main *Variable Properties* tab; **ctrl+click** → the widget's local form
  (`CTree.tsx:220`)
- `FileBrowser.tsx:127-133` renders `selectedGlobalPaths` **and** `selectedLocalPaths`
- `useOnEditionChangesModal` (`Components/Modal.tsx:465`) guards the unsaved
  `newEntity` of whichever scope was picked

So the global edition can't be reused: it's already in use by the main editor, and
clobbering it would discard someone's unsaved changes.

**Fullscreen is the exception** because the conflict can't arise — the widget owns the
screen, the properties panel isn't visible, and reusing the global edition means the
selection survives leaving fullscreen. `forceLocalDispatch` covers a third case: the
*lite* state machine (`StateMachine.component.tsx:60`), which has no main editor to
defer to.

**Local scopes use the full `editing` action set** (`VARIABLE_EDIT`, `FSM_EDIT`,
`VARIABLE_CREATE`, `FILE_EDIT`, `EDITION_CHANGES`, `EDITION_HIGHLIGHT`,
`INSTANCE_*`, `DISCARD_UNSAVED_CHANGES`, `CLOSE_EDITOR`, thunks) — **but not
`events`** (§4.1). Hence: local scope = **edition only**.

---

## 3. Design decisions taken

| Decision | Why |
|---|---|
| Two slices (`edition`, `editorEvents`) rather than one | `editorManagement` never reads `state.events` and vice-versa; splitting is free and gives finer re-render granularity |
| Slice key is `edition`, not `editing` | noun matching the `Edition` type, and avoids `state.editing.editing` if the inner field is ever renamed |
| A local scope's `getState()` returns a **complete** `RootState` with only `edition` swapped in | thunks stay plain `AppThunk`s that never know which scope they run in — no `RootState \| EditionSliceState` union, no cast, no discriminator, and a local-scope thunk can still read any other slice |
| Local scopes stay **React-local** (`useReducer`), not scope-keyed in the store | they're ephemeral form state; scope-keying would put `Record<scope, …>` in every reducer + selector and add scope lifecycle management |
| Local scopes are **edition only**; they read the global `events` | local `events` is dead code today (§4.1) |
| `serializableCheck` / `immutableCheck` must ignore `edition` + `editorEvents` | `Edition` holds jsoninput schemas (functions), `cb` callbacks and whole entities |
| Keep close-on-delete / auto-reselect inside `manageResponseHandler` | behaviour-preserving; moving it is a follow-up (§5) |
| `data/Stores/editingStore.ts` becomes a **shim** (`editingStore = store`, `useEditingStore` over `useAppSelector`, deprecated type aliases) instead of being deleted outright | concentrates the read/write switch into one ~55-line file, so migrating the 87 `editingStore.dispatch` and 7 `useEditingStore` call sites becomes a pure rename with no behaviour change. Deleted at the end of the migration, once nothing imported it |

---

## 3bis. `tsc --noEmit` is silently broken — but the build is **not**

Two different typecheckers, only one of them broken.

| Command | Typechecks? |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` | **NO — silently reports nothing** |
| `yarn build` / `yarn start` (`fork-ts-checker-webpack-plugin`) | **YES — fails the build on type errors** |
| `yarn test` (`ts-jest`) | yes, but only files reachable from a spec (6 specs, 5 pure helpers) |

**Why the CLI is broken.** `ol@10.7.0` ships `.d.ts` using `infer U extends ...`,
TypeScript **4.8+** syntax; the project is on TS **4.6.3** and cannot parse it:

```
node_modules/ol/layer/BaseVector.d.ts(5,138): error TS1005: '?' expected.
```

When a program has *syntactic* errors the tsc CLI reports only those and skips
semantic diagnostics entirely. `--skipLibCheck` does not help (it skips lib
*checking*, not lib *parsing*). Proof: `export const probe: number = 'nope'`
produces no output at all.

**Why the build is fine.** `fork-ts-checker-webpack-plugin`
(`webpack.config.js:30`) uses the same TypeScript and the same tsconfig but is
not affected. Verified empirically: planting the same probe makes `yarn build`
exit 1 with

```
ERROR in ./src/store/__probe.ts:1:14
TS2322: Type 'string' is not assignable to type 'number'.
```

It also never surfaces the two `ol` errors, since it filters `node_modules`
issues — which is why nobody noticed the CLI had gone quiet.

### Where tsc is actually wired

| Where | Detail |
|---|---|
| `webpack.config.js:30` | `ForkTsCheckerWebpackPlugin({ typescript: { configFile: process.env.TS_NODE_PROJECT } })`. `TS_NODE_PROJECT` is set by **only** the `start-no-unused` script; for `start` / `preprod` / `build` it is undefined, so the plugin falls back to `tsconfig.json` |
| TS loader | `babel-loader` — transpile only, no checking. ForkTsChecker is the sole app-wide typecheck |
| CI | `.github/workflows/maven.yml` → `mvn -P release-profile package` → `wegas-app/pom.xml:447` exec-maven-plugin → `yarn install` + `yarn run build` ⇒ **CI does gate on type errors** |
| ESLint | `ESLintPlugin` in the same webpack config, `failOnError: PROD` ⇒ lint errors also fail CI |
| git hooks | none (no husky, no lint-staged) |

### Verification used for this migration

- **`yarn build`** (~35 s) — the project's real gate, and the authoritative check
- plus `npx -y -p typescript@4.9 tsc --noEmit -p tsconfig.json --skipLibCheck`
  for a fast whole-program view. Baseline on the pristine tree: **9 errors**
  (`EntityEditor` x5, `Form.tsx:273`, `TreeVariableSelect:215`, `immutableMerge`
  x2). These are TS-4.9-only — they are *not* errors under 4.6, which is why the
  build is green. `immutableMerge.spec.ts` also fails on the pristine tree.

### Those 9 errors are not "errors that got into the repo"

Under TS **4.6.3** -- the compiler the build and CI actually use -- the code is
clean. Verified three ways:

1. `yarn build` on the migration tree: **exit 0**
2. planting a real error in one of those files (`immutableMerge.ts`) makes
   `yarn build` **exit 1** and report it -- so ForkTsChecker does cover them
3. it reports it even though `immutableMerge.ts` is never bundled by webpack
   (nothing imports `useImmutableMerge`), because ForkTsChecker builds its
   program from `tsconfig.json`, which has no `include`/`exclude` -- so there is
   no scoping gap either

They are **latent upgrade debt**: every TS release tightens inference, so
constructs that compile today get rejected by a later compiler. Nothing was ever
let through.

Likely cause for 6 of the 9 (hypothesis, not bisected -- TS 4.7 cannot parse `ol`
either, so the CLI is silent below 4.8): TS 4.8's `{}` / `unknown` handling. Those
6 are all `Argument of type '{}' is not assignable to ...` in `EntityEditor` and
`Argument of type 'T' is not assignable to '{} | undefined'` in
`TreeVariableSelect`.

**Cost of the bump, measured on this tree:**

| Target | Errors to fix first |
|---|---|
| TS 4.9 | 9 |
| TS 5.9 | 15 |

Nothing is currently unguarded, so this is a scheduling decision, not a fix.

---

## 3ter. There is already a Cypress E2E suite

`wegas-runtime/src/test/node/` — runs in CI via the maven build (the workflow even
uploads failures to filebin.net).

- 5 specs: `1-login/`, `2-gamesManagement/`. **No editor-level specs yet.**
- `cypress-react-selector` (`cy.react(...)`) for component-aware selectors,
  rooted at `#root`
- `yarn start` targets `http://localhost:8080/Wegas`, **`yarn dev` targets
  `http://localhost:3003/Wegas`** — the webpack dev server
- credentials come from `Cypress.env("ADMIN_USERNAME")` / `ADMIN_PASSWORD`, so a
  spec never contains them (no `cypress.env.json` checked in)

This is the natural home for the manual check-list below: ctrl+click scope
isolation, the unsaved-changes modal, the FSM state drag.

---

## 4. Bugs found along the way

### 4.1 Form error banners never render — **NOT fixed here**

```ts
// Editor/Components/EntityEditor.tsx:365-377
export function parseEventFromIndex(
  state: Readonly<WegasEvent[]>,
  dispatch: StoreDispatch = store.dispatch,   // ← the OLD data store, no editing reducer
  index: number = 0,
) {
  if (state.length > index) {
    const currentEvent = state[index];
    if (currentEvent) {
      parseEvent(currentEvent, dispatch);     // ← return value discarded
    }
    return undefined;                          // ← always undefined
  }
}
```

Both call sites are `error={parseEventFromIndex(events)}`
(`EntityEditor.tsx:575`, `InstanceProperties.tsx:209`), so `Form`'s error banner never
receives anything, in any scope. The default `dispatch` is also the wrong store, so the
`onRead` it builds would be inert anyway. Broken in `692b5cdb1` *"Improving event
management and menu display"*, presumably when error display moved to the bell.

⇒ Today `events` is consumed **only** by `Header`'s bell, and only the global list.
That's what makes "local scope = edition only" safe.

### 4.2 `ComponentWithForm` fullscreen dispatched into the wrong store — **fixed here**

`ComponentWithForm.tsx:88` used `store.dispatch` (the *old* data store) for the
fullscreen branch, so fullscreen editing actions went nowhere. That's what the
`as any` on line 118 was hiding.

### 4.3 Conditional hook call — **fixed here**

`ComponentWithForm.tsx:84`: `(fullscreen ? useEditingStore : useLocalStore)(...)`
changes hook order when fullscreen toggles.

### 4.4 `saveEditor`'s File branch ignored the local scope — **fixed here**

It hard-coded `editingStore.dispatch(editFile(res))`, so saving a file from a nested
form re-selected it in the *global* editor. Now uses the thunk's own dispatch.
(The sibling `editorErrorEvent` call stays explicitly global — local scopes have no
event list.)

### 4.5 `websocket.ts` `EntityUpdatedEvent` / `EntityDestroyedEvent` — **behaviour change, decide**

`API/websocket.ts:250` passes `store.dispatch` — the *old* store — as `localDispatch`,
with no `localState`. Consequences today:

- the close/reselect sync is skipped (the guard needed both args)
- `MANAGED_RESPONSE_ACTION` is dispatched into the old store twice (idempotent upsert)
- the return value is `managedValuesOnly`, so events from these pushes never reach the bell

The plan changes the guard to `if (localDispatch)`, which **starts running the sync on
this path**. Probably the correct behaviour (a variable deleted in another tab should
close your form) but it is a change — verify with two browser tabs.

### 4.6 Nested-form events now reach the global bell — **behaviour change, accepted**

Previously a local scope consumed the managed-response events and the global list got
`managedValuesOnly`. Now all events land in `editorEvents`. Arguably an improvement:
errors raised inside a page-component form are no longer silently swallowed.

---

### 4.7 Events accumulate forever in the player — **pre-existing, NOT fixed here**

The event list is **written in every context but read only in the editor**:

- produced by `manageResponseHandler` from *every* managed response
  (`data/actions.ts:200`) — including pure player traffic (`runScript` from a
  slider, `read` on a question, `readMessage` on the inbox) — plus `CustomEvent`
  pushes from `websocket.ts:336`, since the websocket runs in all three entry
  points
- consumed only by the notification bell (`Header.tsx:122`), and `Header` is
  mounted only by `index.tsx`; `player.tsx` and `host.tsx` do not mount it
  (the form-error path is dead, see 4.1)

So in the player nothing ever reads or removes them: no bell, no dismiss, no cap.
It only grows when the server returns events (exceptions, script errors), so it is
a slow drip in a healthy session but appends on every click on a page with a buggy
script.

Identical in the old store (`eventManagement` appended on
`MANAGED_RESPONSE_ACTION`, and the player dispatched `manageResponseHandler`
results into it) — the migration just makes it visible in DevTools for the first
time.

### 4.8 Ctrl+click local scope is unreachable on macOS — **pre-existing, NOT fixed here**

All 10 gates that open an edition in the *local* scope test `e.ctrlKey` only;
`metaKey` appears nowhere in `src/`. `ModifierKeysEvent` (`types/editorEvents.d.ts`)
does not even declare it.

Measured in a real browser on macOS (event listeners on `document`, capture phase):

| Gesture | Events delivered to the page |
|---|---|
| **Ctrl+click** | `mousedown` (ctrl:true) then **`contextmenu`** — *no `click` event at all* |
| **Cmd+click** | `mousedown` then `click` with **`ctrlKey: false`, `metaKey: true`** |

So on macOS ctrl+click is a secondary click (React `onClick` never runs) and cmd+click
fails the `ctrlKey` test. The feature is dead for Mac users.

Sites: `CTree` x4 (220, 249, 267, 285), `StateMachineEditor` x3 (212, 323, 366),
`VariableTreeView:211`, `FileBrowserNode:625`, `Modal:480`.

Proposed fix (~15 lines, awaiting a team decision):

```ts
// types/editorEvents.d.ts
interface ModifierKeysEvent {
  ctrlKey?: boolean;
  metaKey?: boolean;   // Cmd on macOS; ctrl+click there is a right-click
  altKey?: boolean;
}

// Helper/modifierKeys.ts
/** Ctrl on Windows/Linux, Cmd on macOS: "act on the local edition scope". */
export const wantsLocalScope = (e: ModifierKeysEvent) =>
  e.ctrlKey === true || e.metaKey === true;
```

Note this also means the check below marked "verified" for the local scope was
verified by dispatching a synthetic `MouseEvent({ ctrlKey: true })`, which bypasses
the OS translation. It proves the store wiring, not that a Mac user can reach it.

### 4.9 Events only arrive from **successful** responses — and `PlayServer` swallows failures

Found while trying to exercise the notification bell end to end. A deliberately
failing server script produced a textbook event server-side:

```
POST .../VariableDescriptor/Script/Run/19331/  ->  400 Bad Request
{"@class":"ManagedResponse","events":[{"@class":"ExceptionEvent","exceptions":[
  {"@class":"WegasScriptException","message":"Variable \"__nope...\" not found ..."}]}]}
```

...and it never reached the `editorEvents` slice. Two independent reasons:

**a) `API/rest.ts:69-73` throws on any non-2xx**, so `manageResponseHandler` is
never called and the `events` of a failed response are discarded:

```ts
}).then(res => {
  if (res.ok) { return res; }
  throw res;
});
```

This looks deliberate -- errors travel as thrown exceptions for callers to catch,
which is what `extractExceptions` is for. The consequence to remember is that
`editorEvents` only ever receives events from **successful** responses and from
websocket pushes. It also qualifies 4.7: the player's list grows only on 2xx
responses that happen to carry events, so the drip is slower than it looks.

**b) `Editor/Components/PlayServer.tsx:24-36` cannot catch that throw.** It wraps
an async call in a *synchronous* `try`/`catch` with no `.catch()`:

```ts
try {
  asyncRunScript(...).then(result => { setOutput(...); dispatch(manageResponseHandler(result)); });
} catch (error) {
  setError(handleError(error));   // never reached -- the rejection is asynchronous
}
```

Verified in the browser: no output, no error message, an unhandled rejection in
the console. **Run a broken script in the Server Console and you get silence**,
even though the server said exactly what was wrong. Pre-existing and unrelated to
the migration.

## 4bis. Conventions the migration introduced

| Where | Convention |
|---|---|
| module-level app dispatch | `import { dispatch } from '<rel>/store/store'` |
| inside a React component | `useAppDispatch()` (see `ComponentWithForm`) |
| anything colliding with the imported `dispatch` -- a scope-picking local, or a parameter with a default | **rename it `scopedDispatch`**, keep the import plain: `const scopedDispatch = localDispatch ?? dispatch;` |
| a file whose other `dispatch` is a genuinely **different store** (`store.dispatch` of the old data store, as in `Header.tsx`) | alias the app one: `import { dispatch as appDispatch }` — here the alias is the honest signal that two stores are in play |
| props that may carry either scope | `EditingDispatch` (from `store/localEdition`), not `AppDispatch` |
| thunk signatures | `AppThunk<R>` |
| reading the current edition | `selectEdition(state)` — never `state.edition.current` directly |

The rename-the-local rule is the better default: aliasing the *import* leaves a
local still called `dispatch`, so the shadowing confusion survives under a new
name. The migration first landed with `appDispatch` aliases in `CTree`,
`VariableTreeView`, `FileBrowserNode`, `EntityEditor`, `StateMachineEditor`,
`InstanceProperties` and `editingState.ts`; those are being converted to the
rename form, so both shapes may appear for a while.

**Always name it `scopedDispatch`** -- resolved locals *and* parameters alike.
One name, everywhere, so a reader never has to re-derive the pattern per file.

**Do not alias the import.** Keep `import { dispatch } from '<rel>/store/store'`
plain and rename the colliding binding instead.

A parameter has to be renamed for a mechanical reason, not a stylistic one:

```ts
function parseEvent(event: WegasEvent, dispatch: EditingDispatch = dispatch)
//                                     ^^^^^^^^ TS2372: cannot reference itself
```

A parameter's default expression is evaluated in the function's *own* scope, so
`= dispatch` resolves to the parameter, not the module binding. That is a JS
scoping rule -- no flag or syntax avoids it. The two options are aliasing the
import or renaming the parameter, and the parameter is renamed.

A parameter with **no** default needs nothing: `editionActions(editionState,
dispatch: EditingDispatch)` keeps the plain name, because there is no
self-reference to break.

Rejected names, for the record: `modalDispatch` / `vepDispatch` / `ocDispatch`
say only where you already are, need the acronym expanded, and go stale when the
enclosing function is renamed. `localOrGlobalDispatch` is longer and describes how
the value was computed rather than what it is. `readDispatch` (naming a parameter
after what the callee uses it for) was tried and dropped in favour of one
consistent name.

Prefer **`??`** over `||` for the fallback. Identical in practice (the only falsy
value an `EditingDispatch | undefined` can hold is `undefined`), but it states the
actual rule instead of relying on a function always being truthy. Note the wider
codebase is ~650 `||` to ~35 `??`, and `prefer-nullish-coalescing` is not enabled.

Current sites -- resolved locals: `Modal.tsx:477`, `Form.tsx:112`,
`EntityEditor.tsx:509`, `FileBrowserNode.tsx:622`. Parameters with a default:
`EntityEditor.tsx:284`, `:370`. Parameter without one, keeping the plain name:
`EntityEditor.tsx:421`.

`Modal.tsx:477` is not a fallback at all -- it is a plain ternary on
`localChanges`, so `scopedDispatch` can be `undefined` there (hence the
`!= null` guards at 499/509). The other sites cannot be.

All of them disappear if follow-up #5 lands (an `EditingScopeContext` plus
`useEditingDispatch()`), so the naming is cheap and temporary -- consistency
matters more than the exact word.

### Where things live (and what is misplaced)

The tree is mid-migration, so files are split across the old and new store
directories. Three different situations, worth telling apart:

**Correctly stuck — do not move.** Hybrids whose two halves belong to different
stores. They can only be split once `data/Stores/store.ts` goes (follow-up #8):

| File | Contains |
|---|---|
| `data/Reducer/VariableDescriptorReducer.ts` | 1 old-store reducer (registered in `reducers.ts`) **+ 12 `AppThunk`s** |
| `data/Reducer/VariableInstanceReducer.ts` | 1 old-store reducer **+ 14 `AppThunk`s** |
| `data/Reducer/teams.ts` | 1 old-store reducer + 3 old `ThunkResult`s |

**Genuinely misplaced — `data/Reducer/editingState.ts`.** It sits in a folder
called `Reducer/`, is named `editingState`, and yet:

- contains **no reducer** — the only `produce()` calls are immer usage inside
  `deleteState` / `deleteTransition`
- holds **no state** — that is `store/slices/edition.ts`
- is entirely new-store code: type re-exports, 7 `AppThunk`s (`editVariable`,
  `editStateMachine`, `deleteState`, `deleteTransition`, `saveEditor`, `editFile`,
  `createVariable`) and 4 event helpers

Both the name and the folder now mislead. It stayed put for a real reason, though:
its thunks import `Actions.VariableDescriptorActions`, which imports `store/store`,
so moving them **into the slice** would close a cycle `slice -> data -> store ->
slice`. That argument only rules out the slice file itself — a sibling such as
`store/editionThunks.ts` is safe, because `store/store.ts` does not import it, so
nothing cycles back. See follow-up #10.

**Already logged.** `data/selectors/Game.ts`, `GameModel.ts` and
`InitStatusesSelector.ts` read `RootState` but still live beside seven selectors
that read the old store (follow-up #11).

Minor: `store/editing.spec.ts` sits at the `store/` root rather than next to the
slices -- defensible, since it covers two slices plus the middleware config.

**Trap worth remembering:** `Header.tsx` declares `const dispatch = store.dispatch`
where `store` is the **old** data store. A blind `editingStore.dispatch` -> `dispatch`
rename there silently retargeted two `AppThunk`s at the old store; the build caught
it as TS2769. Any file with a local binding called `dispatch` needs checking rather
than a blanket rename.

---

## 4ter. Scaffolding that was removed at the end

Two compatibility shims existed only to keep intermediate steps reviewable, and
both are gone. If you see either name in an old branch, it is dead:

| Removed | What it was |
|---|---|
| `data/Stores/editingStore.ts` | `editingStore` re-pointed at the app store (`dispatch` as a lazy getter, to survive the import cycle), plus `useEditingStore` over `useAppSelector` and the deprecated type aliases |
| `EditingActionCreator` in `data/Reducer/editingState.ts` | a facade mapping the old SCREAMING_CASE names onto the slice action creators (`EDITION_HIGHLIGHT` -> `editionHighlight`, ...). It never touched the old store — but it was pure indirection once the call sites were migrated |

There are now **no `@deprecated` markers left** in the migrated surface. That is
the check to run if you suspect scaffolding was left behind:
`grep -rn "@deprecated" src/store src/data/Reducer/editingState.ts`.

Removing the facade also required dropping six imports in `editingState.ts` that
only fed it. One looked used but was not: `closeEditor` appears in an
`export { closeEditor, ... } from '...'` re-export, and an export-from needs no
import binding.

---

## 5. Covered / not covered

### Covered by this migration

- `editing` → `store/slices/edition.ts`, `events` → `store/slices/editorEvents.ts`
- `editingStore` deleted; all 87 `editingStore.dispatch` sites moved to the app store
- `EditingThunkResult` → `AppThunk`, `EditingStoreDispatch` → `AppDispatch` / `EditingDispatch`
- `editingStoreFactory()` → `useLocalEdition()` (edition only)
- the 7 `useEditingStore` selectors → `useAppSelector`, with explicit equality
  functions on the two that build a fresh object (`EntityEditor`,
  `StateMachineEditor`) — the app store sees far more actions than `editingStore` did
- `EditingActionCreator` facade removed; call sites use the slice action creators (§4ter)
- Role C dissolved — player-side components no longer import editor infrastructure
- Bugs 4.2, 4.3, 4.4 fixed as a side effect
- Serializability/immutability middleware configured for non-serialisable edition payloads
- No `@deprecated` scaffolding left behind (§4ter)

### NOT covered — follow-ups

| # | Item | Notes |
|---|---|---|
| 1 | **Decide on the TypeScript bump** (§3bis) | `yarn build` and CI *do* typecheck; only the hand-run `tsc --noEmit` is silently dead. Bumping to >= 4.8 fixes the CLI and costs fixing 9 TS-4.9-only errors. Not urgent, but the CLI is a trap |
| 2 | **`metaKey` support for the local edition scope** (bug 4.8) | ctrl+click is a right-click on macOS, so the local-scope feature is unreachable there. One shared `wantsLocalScope()` predicate replacing the 10 `e.ctrlKey` gates. Deliberately kept out of the migration PR |
| 3 | **Fix `parseEventFromIndex`** (bug 4.1) | return `parseEvent(...)`'s result and drop the `store.dispatch` default. Decide whether nested forms should show their own errors — if yes, local scopes need an event list again |
| 4 | **Move close-on-delete / auto-reselect out of `manageResponseHandler`** | editor UI policy currently buried in a normalization function; natural home is a `createListenerMiddleware` on `managedResponseReceived`. Would also remove the `localDispatch` / `localEditing` params entirely |
| 5 | **Retire `localDispatch` / `forceLocalDispatch` prop threading** (14 files) | replace with an `EditingScopeContext`; the `forceLocalDispatch \|\| e.ctrlKey` scope-picking in `CTree` / `VariableTreeView` / `FileBrowserNode` / `StateMachineEditor` becomes a context read |
| 6 | **Deduplicate the double `MANAGED_RESPONSE_ACTION`** into the old store from `websocket.ts` (bug 4.5) | harmless but wasteful |
| 7 | **Cap or scope the event log** (bug 4.7) | the player appends events nobody reads. Either keep only the last N in `editorEventAdded` + the `managedResponseReceived` case, or stop collecting outside the editor — the latter needs an "am I in the editor" notion the store does not have, and forecloses ever showing errors to players |
| 8 | **Remaining old stores** | `data/Stores/store.ts` (`variableDescriptors`, `variableInstances`, `global`, `pages`, `players`, `teams`), `pageStore`, `pageContextStore`, `themeStore` |
| 9 | **`data/connectStore.ts` + `Components/Hooks/storeHookFactory.ts`** | can only be deleted once the last old store is gone |
| 10 | **Split `data/Reducer/editingState.ts`** | it has no reducer and no state left: move the 7 thunks to `store/editionThunks.ts` and the event helpers to the `editorEvents` slice, then delete it. Deliberately *not* done in the migration PR -- 13 importers, so it is pure import churn with no functional effect. Best done together with #8, since `data/Reducer/` needs reorganising wholesale anyway |
| 11 | **`data/selectors/*`** | `Game.ts` / `GameModel.ts` are migrated (dual-use `RootState` selectors); `Global.ts`, `Player.ts`, `Team.ts`, `Page.ts`, `VariableDescriptorSelector.ts` still read the old store |
| 12 | **`yarn test` is not run by CI** | `wegas-app/pom.xml` exec-maven-plugin runs only `yarn install`, `yarn run build`, `yarn gulp`. Nothing runs jest -- which is how `immutableMerge.spec.ts` sits failing on master. Cypress runs separately from `wegas-runtime` |
| 13 | **`Helper/immutableMerge.ts` is dead code** | nothing imports `useImmutableMerge`, so the only consumer of `immutableMerge` is its own failing spec. Candidate for deletion, which would also remove 2 of the 9 TS-4.9 errors |
| 14 | **~17 no-op `MANAGED_RESPONSE_ACTION` dispatches** | `manageResponseHandler` already fans out to both stores internally, so the outer `dispatch(manageResponseHandler(res))` now sends an action no app slice handles. Harmless, but noise in DevTools. Removing it needs paren-aware edits, not a regex (a regex attempt broke 7 files mid-migration) |
| 15 | **`PlayServer` swallows script errors** (bug 4.9b) | synchronous `try`/`catch` around an async call, no `.catch()`. A failing Server Console script shows no output and no error. Needs `.catch(e => setError(handleError(e)))` on the promise |
| 16 | **Events from failed responses are dropped** (bug 4.9a) | `rest.ts` throws on non-2xx, so `manageResponseHandler` never sees them. Probably intended -- but decide whether an `ExceptionEvent` on a 4xx should reach the bell, since today only 2xx responses and websocket pushes feed it |
| 17 | **Editor-level Cypress specs** (§3ter) | the harness, the login command and the CI wiring already exist; only lobby/games-management specs are written. Would replace the manual check-list |
| 18 | **No hook/component test setup** | no jsdom, no `@testing-library/react`; all specs are pure logic, so `useLocalEdition` and the selector call sites are only covered by manual checks |
| 19 | **Real store not importable in tests** | `store/store` pulls `API/rest` -> `data/Stores/store` -> `wegas-ts-api`, which ships untranspiled ESM; needs `transformIgnorePatterns` |

### What the browser checks actually cover

Re-run against the final code (dev server + real backend, scenario 204):

| # | Check | Exercises |
|---|---|---|
| 1 | editor boots | the import cycle, now that the shim is gone |
| 2 | plain-click a file -> form in *Variable Settings* | `EntityEditor`'s rewritten selector + `customStateEquals` |
| 3 | ctrl+click -> form inside the Files tab, global untouched | `useLocalEdition` scope isolation |
| 4 | fullscreen, form `x` -> clears the **global** edition, local survives | `ComponentWithForm`'s fullscreen branch (bug 4.2) |
| 5 | click a tree node -> `globalSelection` class + form | `CTree`'s rewritten boolean selector |
| 6 | open an FSM -> graph renders | `StateMachineEditor`'s selector + its equality fn |
| 7 | *Instance* action -> list -> row -> close | `instanceEditor` / `instanceEdit` and `InstanceProperties`' required prop |
| 8 | Languages tab renders | the two simplified `TranslationsEditor` selectors |
| 9 | FSM state drag | `updateStatePosition`'s `selectEdition(store.getState())` |

**Not covered in the browser:** the `editorEvents` *read* path (bell -> mark read
-> dismiss). Only the reducer is covered, by `store/editing.spec.ts`. Exercising it
needs a 2xx response that carries events, which is awkward to trigger on demand --
see 4.9 for why the obvious approach (a failing script) cannot work.

Note ctrl+click in checks 3 and 4 was performed by dispatching a synthetic
`MouseEvent({ ctrlKey: true })`. That proves the store wiring but **not** that a
macOS user can reach it -- see 4.8.

### Gotchas to remember

- **Comparator polarity is inverted.** `useAnyStore` takes a `shouldUpdate`
  ("different") predicate; `useAppSelector` takes an `equalityFn` ("equal").
  `shallowDifferent` → `shallowEqual`, `deepDifferent` → `(a, b) => !deepDifferent(a, b)`.
- **Any selector building a fresh object needs an equality function.** The app store
  sees far more actions than `editingStore` did, so a bare reference comparison
  re-renders on everything. Use `customStateEquals` from `store/hooks.ts`.
- **`useReducer` batches.** A local-scope thunk that dispatches and then reads
  `getState()` sees the pre-dispatch value. The only existing case is `saveEditor`
  (`discardUnsavedChanges()` then read `type`/`parentId`/`cb` — unaffected). Don't add
  new dispatch-then-read thunks.
