import type { ChangeEvent } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { JSAction, JSCollection } from "entities/JSCollection";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  setActiveJSAction,
  startExecutingJSFunction,
  updateJSCollectionBody,
} from "actions/jsPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import JSResponseView from "components/editorComponents/JSResponseView";
import { isEmpty } from "lodash";
import equal from "fast-deep-equal/es6";
import type { AppState } from "@appsmith/reducers";
import {
  getActiveJSActionId,
  getIsExecutingJSAction,
  getJSActions,
  getJSCollectionParseErrors,
} from "selectors/entitiesSelector";
import type { JSActionDropdownOption } from "./utils";
import {
  convertJSActionToDropdownOption,
  getActionFromJsCollection,
  getJSActionOption,
  getJSFunctionLineGutter,
  getJSPropertyLineFromName,
} from "./utils";
import JSObjectHotKeys from "./JSObjectHotKeys";
import { Form, FormWrapper } from "./styledComponents";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import {
  hasExecuteActionPermission,
  hasManageActionPermission,
} from "@appsmith/utils/permissionHelpers";
import {
  setCodeEditorCursorAction,
  setFocusableInputField,
} from "actions/editorContextActions";
import history from "utils/history";
import { CursorPositionOrigin } from "reducers/uiReducers/editorContextReducer";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import styled from "styled-components";
import { showDebuggerFlag } from "selectors/debuggerSelectors";

interface JSFormProps {
  jsCollection: JSCollection;
}

type Props = JSFormProps;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  height: 100%;
`;

function JSEditorForm({ jsCollection: currentJSCollection }: Props) {
  const theme = EditorTheme.LIGHT;
  const dispatch = useDispatch();
  const { hash } = useLocation();

  const [disableRunFunctionality, setDisableRunFunctionality] = useState(false);

  // Currently active response (only changes upon execution)
  const [activeResponse, setActiveResponse] = useState<JSAction | null>(null);
  const parseErrors = useSelector(
    (state: AppState) =>
      getJSCollectionParseErrors(state, currentJSCollection.name),
    equal,
  );
  const jsActions = useSelector(
    (state: AppState) => getJSActions(state, currentJSCollection.id),
    equal,
  );
  const activeJSActionId = useSelector((state: AppState) =>
    getActiveJSActionId(state, currentJSCollection.id),
  );

  const activeJSAction = getActionFromJsCollection(
    activeJSActionId,
    currentJSCollection,
  );

  const [selectedJSActionOption, setSelectedJSActionOption] =
    useState<JSActionDropdownOption>(
      getJSActionOption(activeJSAction, jsActions),
    );

  const isExecutingCurrentJSAction = useSelector((state: AppState) =>
    getIsExecutingJSAction(
      state,
      currentJSCollection.id,
      selectedJSActionOption.data?.id || "",
    ),
  );

  useEffect(() => {
    if (hash) {
      // Hash here could mean to navigate (set cursor/focus) to a particular function
      // If the hash has a function name in this JS Object, we will set that
      const actionName = hash.substring(1);
      const position = getJSPropertyLineFromName(
        currentJSCollection.body,
        actionName,
      );
      if (position) {
        // Resetting the focus and position based on the cmd click navigation
        dispatch(setFocusableInputField(`${currentJSCollection.name}.body`));
        dispatch(
          setCodeEditorCursorAction(
            `${currentJSCollection.name}.body`,
            position,
            CursorPositionOrigin.Navigation,
          ),
        );
        // Replace to remove the hash and set back the original URL
        history.replace(window.location.pathname + window.location.search);
      }
    }
  }, [hash]);

  const isChangePermitted = hasManageActionPermission(
    currentJSCollection?.userPermissions || [],
  );
  const isExecutePermitted = hasExecuteActionPermission(
    currentJSCollection?.userPermissions || [],
  );

  // Triggered when there is a change in the code editor
  const handleEditorChange = (valueOrEvent: ChangeEvent<any> | string) => {
    const value: string =
      typeof valueOrEvent === "string"
        ? valueOrEvent
        : valueOrEvent.target.value;

    dispatch(updateJSCollectionBody(value, currentJSCollection.id));
  };

  // Executes JS action
  const executeJSAction = (jsAction: JSAction, from: EventLocation) => {
    setActiveResponse(jsAction);
    if (jsAction.id !== selectedJSActionOption.data?.id)
      setSelectedJSActionOption(convertJSActionToDropdownOption(jsAction));
    dispatch(
      setActiveJSAction({
        jsCollectionId: currentJSCollection.id || "",
        jsActionId: jsAction.id || "",
      }),
    );
    dispatch(
      startExecutingJSFunction({
        collectionName: currentJSCollection.name || "",
        action: jsAction,
        collectionId: currentJSCollection.id || "",
        from: from,
      }),
    );
  };

  const handleActiveActionChange = useCallback(
    (jsAction: JSAction) => {
      if (!jsAction) return;

      // only update when there is a new active action
      if (jsAction.id !== selectedJSActionOption.data?.id) {
        setSelectedJSActionOption(convertJSActionToDropdownOption(jsAction));
      }
    },
    [selectedJSActionOption],
  );

  const JSGutters = useMemo(
    () =>
      getJSFunctionLineGutter(
        jsActions,
        executeJSAction,
        !parseErrors.length,
        handleActiveActionChange,
        isExecutePermitted,
      ),
    [jsActions, parseErrors, handleActiveActionChange, isExecutePermitted],
  );

  const handleRunAction = (
    event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
    from: EventLocation,
  ) => {
    event.preventDefault();
    if (
      !disableRunFunctionality &&
      !isExecutingCurrentJSAction &&
      selectedJSActionOption.data
    ) {
      executeJSAction(selectedJSActionOption.data, from);
    }
  };

  useEffect(() => {
    if (parseErrors.length || isEmpty(jsActions)) {
      setDisableRunFunctionality(true);
    } else {
      setDisableRunFunctionality(false);
    }
  }, [parseErrors, jsActions, activeJSActionId]);

  useEffect(() => {
    // update the selectedJSActionOption when there is addition or removal of jsAction or function
    setSelectedJSActionOption(getJSActionOption(activeJSAction, jsActions));
  }, [jsActions, activeJSActionId]);

  const blockCompletions = useMemo(() => {
    if (selectedJSActionOption.label) {
      const funcName = `${selectedJSActionOption.label}()`;
      return [
        {
          parentPath: "this",
          subPath: funcName,
        },
        {
          parentPath: currentJSCollection.name,
          subPath: funcName,
        },
      ];
    }
    return [];
  }, [selectedJSActionOption.label, currentJSCollection.name]);

  // Debugger render flag
  const showDebugger = useSelector(showDebuggerFlag);

  //   const setSelectedConfigTab = useCallback((selectedTab: JSEditorTab) => {
  //     dispatch(setJsPaneConfigSelectedTab(selectedTab));
  //   }, []);

  return (
    <FormWrapper>
      <JSObjectHotKeys
        runActiveJSFunction={(
          event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
        ) => {
          handleRunAction(event, "KEYBOARD_SHORTCUT");
        }}
      >
        <Form onSubmit={(event) => event.preventDefault()}>
          <Wrapper>
            <div className="flex flex-1">
              <SecondaryWrapper>
                <LazyCodeEditor
                  blockCompletions={blockCompletions}
                  border={CodeEditorBorder.NONE}
                  borderLess
                  className={"js-editor"}
                  customGutter={JSGutters}
                  dataTreePath={`${currentJSCollection.name}.body`}
                  disabled={!isChangePermitted}
                  folding
                  height={"100%"}
                  hideEvaluatedValue
                  input={{
                    value: currentJSCollection.body,
                    onChange: handleEditorChange,
                  }}
                  isJSObject
                  jsObjectName={currentJSCollection.name}
                  mode={EditorModes.JAVASCRIPT}
                  placeholder="Let's write some code!"
                  showLightningMenu={false}
                  showLineNumbers
                  size={EditorSize.EXTENDED}
                  tabBehaviour={TabBehaviour.INDENT}
                  theme={theme}
                />
                {showDebugger ? (
                  <JSResponseView
                    currentFunction={activeResponse}
                    disabled={disableRunFunctionality || !isExecutePermitted}
                    errors={parseErrors}
                    isLoading={isExecutingCurrentJSAction}
                    jsObject={currentJSCollection}
                    onButtonClick={(
                      event:
                        | React.MouseEvent<HTMLElement, MouseEvent>
                        | KeyboardEvent,
                    ) => {
                      handleRunAction(event, "JS_OBJECT_RESPONSE_RUN_BUTTON");
                    }}
                    theme={theme}
                  />
                ) : null}
              </SecondaryWrapper>
            </div>
          </Wrapper>
        </Form>
      </JSObjectHotKeys>
    </FormWrapper>
  );
}

export default JSEditorForm;
