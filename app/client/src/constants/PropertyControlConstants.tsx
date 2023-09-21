import { getPropertyControlTypes } from "components/propertyControls";
import type {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import type { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type { UpdateWidgetPropertyPayload } from "actions/controlActions";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import type { Stylesheet } from "entities/AppTheming";
import type { ReduxActionType } from "@appsmith/constants/ReduxActionConstants";
import type { PropertyUpdates } from "WidgetProvider/constants";
import type { WidgetProps } from "widgets/BaseWidget";

const ControlTypes = getPropertyControlTypes();
export type ControlType = (typeof ControlTypes)[keyof typeof ControlTypes];

export type PropertyPaneSectionConfig = {
  sectionName: string;
  id?: string;
  children: PropertyPaneConfig[];
  collapsible?: boolean; // Indicates whether the section could be collapsed or not
  childrenId?: string; // A unique id generated by combining the ids of all the children
  hidden?: (props: any, propertyPath: string) => boolean;
  isDefaultOpen?: boolean;
  propertySectionPath?: string;
  tag?: string; // Used to show a tag right after the section name (only in the search results)

  hasDynamicProperties: boolean;
  generateDynamicProperty: (widget: WidgetProps) => PropertyPaneControlConfig[];
};

export type PanelConfig = {
  editableTitle: boolean;
  titlePropertyName: string;
  panelIdPropertyName: string;
  children?: PropertyPaneConfig[];
  contentChildren?: PropertyPaneConfig[];
  styleChildren?: PropertyPaneConfig[];
  searchConfig?: PropertyPaneConfig[]; // A combination of contentChildren and contentChildren which will be used to display search results
  updateHook: (
    props: any,
    propertyPath: string,
    propertyValue: any,
  ) => Array<PropertyUpdates> | undefined;
};

export type PropertyPaneControlConfig = {
  id?: string;
  label: string;
  propertyName: string;
  // Serves in the tooltip
  helpText?: string;
  //Dynamic text serves below the property pane inputs
  helperText?: ((props: any) => string) | string;
  isJSConvertible?: boolean;
  customJSControl?: string;
  controlType: ControlType;
  validationMessage?: string;
  dataTreePath?: string;
  children?: PropertyPaneConfig[];
  panelConfig?: PanelConfig;
  updateRelatedWidgetProperties?: (
    propertyName: string,
    propertyValue: any,
    props: any,
  ) => UpdateWidgetPropertyPayload[];
  updateHook?: (
    props: any,
    propertyName: string,
    propertyValue: any,
  ) => Array<PropertyUpdates> | undefined;
  hidden?: (props: any, propertyPath: string) => boolean;
  invisible?: boolean;
  isBindProperty: boolean;
  isTriggerProperty: boolean;
  validation?: ValidationConfig;
  useValidationMessage?: boolean;
  additionalAutoComplete?: (props: any) => AdditionalDynamicDataTree;
  evaluationSubstitutionType?: EvaluationSubstitutionType;
  dependencies?: string[];
  evaluatedDependencies?: string[]; // dependencies to be picked from the __evaluated__ object
  expected?: CodeEditorExpected;
  getStylesheetValue?: (
    props: any,
    propertyPath: string,
    stylesheet?: Stylesheet,
  ) => Stylesheet[string];
  // TODO(abhinav): To fix this, rename the options property of the controls which use this
  // Alternatively, create a new structure
  options?: any;
  // The following should ideally be used internally
  postUpdateAction?: ReduxActionType;
  onBlur?: () => void;
  onFocus?: () => void;
  isPanelProperty?: boolean;
  // Numeric Input Control
  min?: number;
  // Switch mode ( JS -> Text )
  shouldSwitchToNormalMode?: (
    isDynamic: boolean,
    isToggleDisabled: boolean,
    triggerFlag?: boolean,
  ) => boolean;
};

type ValidationConfigParams = {
  min?: number; // min allowed for a number
  max?: number; // max allowed for a number
  natural?: boolean; // is a positive integer
  default?: unknown; // default for any type
  unique?: boolean | string[]; // unique in an array (string if a particular path is unique)
  required?: boolean; // required type
  // required is now used to check if value is an empty string.
  requiredKey?: boolean; //required key
  regex?: RegExp; // validator regex for text type
  allowedKeys?: Array<{
    // Allowed keys in an object type
    name: string;
    type: ValidationTypes;
    params?: ValidationConfigParams;
  }>;
  allowedValues?: unknown[]; // Allowed values in a string and array type
  children?: ValidationConfig; // Children configurations in an ARRAY or OBJECT_ARRAY type
  fn?: (
    value: unknown,
    props: any,
    _?: any,
    moment?: any,
  ) => ValidationResponse; // Function in a FUNCTION type
  fnString?: string; // AUTO GENERATED, SHOULD NOT BE SET BY WIDGET DEVELOPER
  expected?: CodeEditorExpected; // FUNCTION type expected type and example
  strict?: boolean; //for strict string validation of TEXT type
  ignoreCase?: boolean; //to ignore the case of key
  type?: ValidationTypes; // Used for ValidationType.ARRAY_OF_TYPE_OR_TYPE to define sub type
  types?: ValidationConfig[]; // Used for ValidationType.UNION to define sub type
  params?: ValidationConfigParams; // Used for ValidationType.ARRAY_OF_TYPE_OR_TYPE to define sub type params
  passThroughOnZero?: boolean; // Used for ValidationType.NUMBER to allow 0 to be passed through. Deafults value is true
  limitLineBreaks?: boolean; // Used for ValidationType.TEXT to limit line breaks in a large json object.
  defaultValue?: unknown; // used for ValidationType.UNION when none the union type validation is success
  defaultErrorMessage?: string; // used for ValidationType.UNION when none the union type validation is success
};

export type ValidationConfig = {
  type: ValidationTypes;
  params?: ValidationConfigParams;
  dependentPaths?: string[];
};

export type PropertyPaneConfig =
  | PropertyPaneSectionConfig
  | PropertyPaneControlConfig;

export interface ActionValidationConfigMap {
  [configProperty: string]: ValidationConfig;
}
