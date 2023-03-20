import { reflowMoveAction, stopReflowAction } from "actions/reflowActions";
import { DefaultDimensionMap } from "components/editorComponents/ResizableComponent";
import {
  isHandleResizeAllowed,
  isResizingDisabled,
} from "components/editorComponents/ResizableUtils";
import type { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  GridDefaults,
  WIDGET_PADDING,
  WidgetHeightLimits,
} from "constants/WidgetConstants";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spring } from "react-spring";
import type {
  MovementLimitMap,
  ReflowedSpace,
  ReflowedSpaceMap,
} from "reflow/reflowTypes";
import { ReflowDirection } from "reflow/reflowTypes";
import {
  ResizableHandle,
  RESIZE_BORDER_BUFFER,
  ResizeWrapper,
} from "resizable/common";
import type { DimensionUpdateProps, ResizableProps } from "resizable/common";
import { getWidgets } from "sagas/selectors";
import { getIsMobile } from "selectors/mainCanvasSelectors";
import {
  getCanvasWidth,
  getContainerOccupiedSpacesSelectorWhileResizing,
} from "selectors/editorSelectors";
import { getReflowSelector } from "selectors/widgetReflowSelectors";
import {
  getFillWidgetLengthForLayer,
  getLayerIndexOfWidget,
} from "utils/autoLayout/AutoLayoutUtils";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { getWidgetMinMaxDimensionsInPixel } from "utils/autoLayout/flexWidgetUtils";
import { useReflow } from "utils/hooks/useReflow";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import WidgetFactory from "utils/WidgetFactory";
import { isDropZoneOccupied } from "utils/WidgetPropsUtils";

export function ReflowResizable(props: ResizableProps) {
  const resizableRef = useRef<HTMLDivElement>(null);
  const [isResizing, setResizing] = useState(false);
  const occupiedSpacesBySiblingWidgets = useSelector(
    getContainerOccupiedSpacesSelectorWhileResizing(props.parentId),
  );
  const mainCanvasWidth = useSelector(getCanvasWidth);
  const checkForCollision = (widgetNewSize: {
    left: number;
    top: number;
    bottom: number;
    right: number;
  }) => {
    return isDropZoneOccupied(
      widgetNewSize,
      props.widgetId,
      occupiedSpacesBySiblingWidgets,
    );
  };
  // Performance tracking start
  const sentryPerfTags = props.zWidgetType
    ? [{ name: "widget_type", value: props.zWidgetType }]
    : [];
  PerformanceTracker.startTracking(
    PerformanceTransactionName.SHOW_RESIZE_HANDLES,
    { widgetId: props.zWidgetId },
    true,
    sentryPerfTags,
  );
  const reflowSelector = getReflowSelector(props.widgetId);

  const equal = (
    reflowA: ReflowedSpace | undefined,
    reflowB: ReflowedSpace | undefined,
  ) => {
    if (
      reflowA?.width !== reflowB?.width ||
      reflowA?.height !== reflowB?.height
    )
      return false;

    return true;
  };

  const reflowedPosition = useSelector(reflowSelector, equal);

  const reflow = useReflow(
    [props.originalPositions],
    props.parentId || "",
    props.gridProps,
    false,
  );

  useEffect(() => {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.SHOW_RESIZE_HANDLES,
    );
  }, []);
  //end
  const [pointerEvents, togglePointerEvents] = useState(true);
  const [newDimensions, set] = useState<DimensionUpdateProps>({
    width: props.componentWidth,
    height: props.componentHeight,
    x: 0,
    y: 0,
    reset: false,
    direction: ReflowDirection.UNSET,
    reflectDimension: true,
    reflectPosition: true,
  });
  const allWidgets = useSelector(getWidgets);
  const isMobile = useSelector(getIsMobile);
  const dimensionMap = isMobile
    ? {
        leftColumn: "mobileLeftColumn",
        rightColumn: "mobileRightColumn",
        topRow: "mobileTopRow",
        bottomRow: "mobileBottomRow",
      }
    : DefaultDimensionMap;
  const {
    bottomRow: bottomRowMap,
    leftColumn: leftColumnMap,
    rightColumn: rightColumnMap,
    topRow: topRowMap,
  } = dimensionMap;
  const dispatch = useDispatch();
  const { computedAlignment, layer } = useMemo(() => {
    const { widgetId } = props;
    const widget = allWidgets[widgetId];
    const layer = (() => {
      if (!widget || !widget?.parentId) return {};
      const parent = allWidgets[widget?.parentId];
      if (!parent) return {};
      const flexLayers = parent.flexLayers;
      const layerIndex = getLayerIndexOfWidget(flexLayers, widgetId);
      if (layerIndex === -1) return {};
      return flexLayers[layerIndex];
    })();
    const computedAlignment = (() => {
      const centerColumn = GridDefaults.DEFAULT_GRID_COLUMNS / 2;
      const leftColumn = widget[leftColumnMap];
      return leftColumn > centerColumn ? "end" : "start";
    })();
    return { computedAlignment, layer };
  }, [props, allWidgets, leftColumnMap]);
  const hasFillChild =
    !!layer &&
    layer?.children?.length &&
    layer.children.some((each: any) => {
      const widget = allWidgets[each.id];
      return widget && widget?.responsiveBehavior === ResponsiveBehavior.Fill;
    });
  const widgetAlignment = hasFillChild
    ? computedAlignment
    : allWidgets[props.widgetId]?.alignment || FlexLayerAlignment.Start;
  const triggerAutoLayoutBasedReflow = (resizedPositions: OccupiedSpace) => {
    let canHorizontalMove = false;
    const widgets = {
      ...allWidgets,
      [props.widgetId]: {
        ...allWidgets[props.widgetId],
        leftColumn: resizedPositions.left,
        rightColumn: resizedPositions.right,
        topRow: resizedPositions.top,
        bottomRow: resizedPositions.bottom,
      },
    };
    const fillWidgetsLength = getFillWidgetLengthForLayer(layer, widgets);
    if (fillWidgetsLength) {
      let correctedMovementMap: ReflowedSpaceMap = {};
      for (const child of layer.children) {
        const childWidget = allWidgets[child.id];
        const updatedWidth = fillWidgetsLength * widget?.parentColumnSpace;
        if (
          childWidget &&
          childWidget.responsiveBehavior === ResponsiveBehavior.Fill &&
          (childWidget[rightColumnMap] - childWidget[leftColumnMap]) *
            childWidget.parentColumnSpace !==
            updatedWidth
        ) {
          canHorizontalMove = true;
          correctedMovementMap = {
            ...correctedMovementMap,
            [child.id]: {
              width: fillWidgetsLength * widget?.parentColumnSpace,
            },
          };
        }
      }
      dispatch(reflowMoveAction(correctedMovementMap));
    }
    return canHorizontalMove;
  };

  const setNewDimensions = (
    direction: ReflowDirection,
    resizedPositions: OccupiedSpace,
    rect: DimensionUpdateProps,
  ) => {
    const { canResizeHorizontally, canResizeVertically } =
      props.getResizedPositions(resizedPositions);
    const canResize = canResizeHorizontally || canResizeVertically;
    if (canResize) {
      set((prevState) => {
        let newRect = { ...rect };
        let canVerticalMove = true,
          canHorizontalMove = true,
          bottomMostRow = 0,
          movementLimitMap: MovementLimitMap | undefined = {};

        if (resizedPositions) {
          //calling reflow to update movements of reflowing widgets and get movementLimit of current resizing widget
          ({ bottomMostRow, movementLimitMap } = reflow.reflowSpaces(
            [resizedPositions],
            direction,
            true,
          ));
        }

        if (
          resizedPositions &&
          movementLimitMap &&
          movementLimitMap[resizedPositions.id]
        ) {
          ({ canHorizontalMove, canVerticalMove } =
            movementLimitMap[resizedPositions.id]);
        }
        if (!isMobile && hasFillChild) {
          canHorizontalMove = triggerAutoLayoutBasedReflow(resizedPositions);
        }

        //if it should not resize horizontally, we keep keep the previous horizontal dimensions
        if (!canHorizontalMove || !(canResizeHorizontally || hasFillChild)) {
          newRect = {
            ...newRect,
            width: prevState.width,
            x: prevState.x,
            X: prevState.X,
          };
        }

        //if it should not resize vertically, we keep keep the previous vertical dimensions
        if (!canVerticalMove || !canResizeVertically) {
          newRect = {
            ...newRect,
            height: prevState.height,
            y: prevState.y,
            Y: prevState.Y,
          };
        }

        if (
          (canResizeHorizontally || hasFillChild) &&
          canResizeVertically &&
          canVerticalMove &&
          canHorizontalMove
        ) {
          updatedPositions.current = resizedPositions;
        }

        if (bottomMostRow) {
          props.updateBottomRow(bottomMostRow);
        }

        return newRect;
      });
    }
  };

  useEffect(() => {
    set((prevDimensions) => {
      return {
        ...prevDimensions,
        width: props.componentWidth,
        height: props.componentHeight,
        x: 0,
        y: 0,
        reset: true,
      };
    });
  }, [props.componentHeight, props.componentWidth, isResizing]);

  const handles = [];
  const widget = allWidgets[props.widgetId];
  const { minHeight: widgetMinHeight, minWidth: widgetMinWidth } =
    getWidgetMinMaxDimensionsInPixel(widget, mainCanvasWidth);
  const resizedPositions = {
    left: widget[leftColumnMap],
    right: widget[rightColumnMap],
    top: widget[topRowMap],
    bottom: widget[bottomRowMap],
    id: widget?.widgetId,
  };
  const updatedPositions = useRef(resizedPositions);
  if (widget[leftColumnMap] !== 0 && props.handles.left) {
    handles.push({
      dragCallback: (x: number) => {
        if (
          widgetMinWidth &&
          props.componentWidth - x < widgetMinWidth &&
          x > 0
        )
          return;
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          y: newDimensions.y,
          direction: ReflowDirection.LEFT,
          X: x,
          height: newDimensions.height,
          width: props.componentWidth,
          x: x,
        };
        const currentUpdatePositions = { ...updatedPositions.current };
        if (widgetAlignment === "start") {
          currentUpdatePositions.right =
            widget[rightColumnMap] - x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          currentUpdatePositions.right =
            widget[rightColumnMap] - x / widget?.parentColumnSpace;
          currentUpdatePositions.left =
            widget[leftColumnMap] + x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          currentUpdatePositions.left =
            widget[leftColumnMap] + x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - x,
            x,
          };
        }
        setNewDimensions(
          ReflowDirection.LEFT,
          currentUpdatePositions,
          dimensionUpdates,
        );
      },
      component: props.handles.left,
      handleDirection: ReflowDirection.LEFT,
    });
  }

  if (
    !(
      widget[leftColumnMap] !== 0 &&
      widget[rightColumnMap] === GridDefaults.DEFAULT_GRID_COLUMNS
    ) &&
    props.handles.right
  ) {
    handles.push({
      dragCallback: (x: number) => {
        if (
          widgetMinWidth &&
          props.componentWidth + x < widgetMinWidth &&
          x < 0
        )
          return;
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          y: newDimensions.y,
          direction: ReflowDirection.RIGHT,
          X: x,
          height: newDimensions.height,
          width: props.componentWidth,
          x: x,
        };
        const currentUpdatePositions = { ...updatedPositions.current };
        if (widgetAlignment === "start") {
          currentUpdatePositions.right =
            widget[rightColumnMap] + x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          currentUpdatePositions.right =
            widget[rightColumnMap] + x / widget?.parentColumnSpace;
          currentUpdatePositions.left =
            widget[leftColumnMap] - x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          currentUpdatePositions.left =
            widget[leftColumnMap] - x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + x,
            x: 0,
          };
        }
        setNewDimensions(
          ReflowDirection.RIGHT,
          currentUpdatePositions,
          dimensionUpdates,
        );
      },
      component: props.handles.right,
      handleDirection: ReflowDirection.RIGHT,
    });
  }

  if (props.handles.bottom) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        if (
          widgetMinHeight &&
          props.componentHeight + y < widgetMinHeight &&
          y < 0
        )
          return;
        const currentUpdatePositions = { ...updatedPositions.current };
        currentUpdatePositions.bottom =
          widget[bottomRowMap] + y / widget?.parentRowSpace;
        setNewDimensions(ReflowDirection.BOTTOM, currentUpdatePositions, {
          width: newDimensions.width,
          height: props.componentHeight + y,
          x: newDimensions.x,
          y: newDimensions.y,
          direction: ReflowDirection.BOTTOM,
          Y: y,
          reflectDimension: true,
          reflectPosition: true,
        });
      },
      component: props.handles.bottom,
      handleDirection: ReflowDirection.BOTTOM,
    });
  }

  if (props.handles.bottomRight) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          y: newDimensions.y,
          width: props.componentWidth + x,
          height: props.componentHeight + y,
          x: newDimensions.x,
          direction: ReflowDirection.BOTTOMRIGHT,
          X: x,
          Y: y,
        };
        const currentUpdatePositions = { ...updatedPositions.current };
        currentUpdatePositions.bottom =
          widget[bottomRowMap] + y / widget?.parentRowSpace;
        if (widgetAlignment === "start") {
          currentUpdatePositions.right =
            widget[rightColumnMap] + x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          currentUpdatePositions.right =
            widget[rightColumnMap] + x / widget?.parentColumnSpace;
          currentUpdatePositions.left =
            widget[leftColumnMap] - x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          currentUpdatePositions.left =
            widget[leftColumnMap] - x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + x,
            x: 0,
          };
        }
        setNewDimensions(
          ReflowDirection.BOTTOMRIGHT,
          currentUpdatePositions,
          dimensionUpdates,
        );
      },
      component: props.handles.bottomRight,
      handleDirection: ReflowDirection.BOTTOMRIGHT,
      affectsWidth: true,
    });
  }

  if (props.handles.bottomLeft) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          x: x,
          width: props.componentWidth - x,
          height: props.componentHeight + y,
          y: newDimensions.y,
          direction: ReflowDirection.BOTTOMLEFT,
          X: x,
          Y: y,
        };
        const currentUpdatePositions = { ...updatedPositions.current };

        currentUpdatePositions.bottom =
          widget[bottomRowMap] + y / widget?.parentRowSpace;
        if (widgetAlignment === "start") {
          currentUpdatePositions.right =
            widget[rightColumnMap] - x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          currentUpdatePositions.right =
            widget[rightColumnMap] - x / widget?.parentColumnSpace;
          currentUpdatePositions.left =
            widget[leftColumnMap] + x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          currentUpdatePositions.left =
            widget[leftColumnMap] + x / widget?.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - x,
            x,
          };
        }
        setNewDimensions(
          ReflowDirection.BOTTOMLEFT,
          currentUpdatePositions,
          dimensionUpdates,
        );
      },
      component: props.handles.bottomLeft,
      handleDirection: ReflowDirection.BOTTOMLEFT,
      affectsWidth: true,
    });
  }

  const onResizeStop = () => {
    togglePointerEvents(true);
    dispatch(stopReflowAction());

    props.onStop(
      {
        width:
          props.componentWidth +
          (updatedPositions.current.right - resizedPositions.right) *
            widget.parentColumnSpace,
        height:
          props.componentHeight +
          (updatedPositions.current.bottom - resizedPositions.bottom) *
            widget.parentRowSpace,
      },
      {
        x:
          (updatedPositions.current.left - resizedPositions.left) *
          widget.parentColumnSpace,
        y:
          (updatedPositions.current.top - resizedPositions.top) *
          widget.parentRowSpace,
      },
      dimensionMap,
    );
    setResizing(false);
  };

  const renderHandles = handles.map((handle, index) => {
    const disableDot = !isHandleResizeAllowed(
      props.enableHorizontalResize,
      props.enableVerticalResize,
      handle.handleDirection,
    );

    let disableResizing = false;

    if (widget && widget.type) {
      const { disableResizeHandles } = WidgetFactory.getWidgetAutoLayoutConfig(
        widget.type,
      );

      disableResizing = isResizingDisabled(
        disableResizeHandles,
        handle.handleDirection,
        props.isFlexChild,
        props.responsiveBehavior,
      );
    }

    return (
      <ResizableHandle
        {...handle}
        allowResize={
          props.allowResize &&
          !(
            props.responsiveBehavior === ResponsiveBehavior.Fill &&
            handle?.affectsWidth
          ) &&
          !disableResizing
        }
        checkForCollision={checkForCollision}
        direction={handle.handleDirection}
        disableDot={disableDot || disableResizing}
        isHovered={props.isHovered}
        key={index}
        onStart={() => {
          togglePointerEvents(false);
          props.onStart();
          updatedPositions.current = resizedPositions;
          setResizing(true);
        }}
        onStop={onResizeStop}
        scrollParent={resizableRef.current}
        snapGrid={props.snapGrid}
      />
    );
  });
  const widgetWidth =
    (reflowedPosition?.width === undefined
      ? newDimensions.width
      : reflowedPosition.width - 2 * WIDGET_PADDING) + RESIZE_BORDER_BUFFER;
  const widgetHeight =
    (reflowedPosition?.height === undefined
      ? newDimensions.height
      : reflowedPosition.height - 2 * WIDGET_PADDING) + RESIZE_BORDER_BUFFER;
  return (
    <Spring
      config={{
        clamp: true,
        friction: 0,
        tension: 999,
      }}
      from={{
        width: props.componentWidth,
        height: props.fixedHeight
          ? Math.min(
              (props.maxDynamicHeight ||
                WidgetHeightLimits.MAX_HEIGHT_IN_ROWS) *
                GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              props.componentHeight,
            )
          : "auto",
        maxHeight:
          (props.maxDynamicHeight || WidgetHeightLimits.MAX_HEIGHT_IN_ROWS) *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      }}
      immediate={newDimensions.reset ? true : false}
      to={{
        width: widgetWidth,
        height: props.fixedHeight
          ? Math.min(
              (props.maxDynamicHeight ||
                WidgetHeightLimits.MAX_HEIGHT_IN_ROWS) *
                GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              widgetHeight,
            )
          : "auto",

        maxHeight:
          (props.maxDynamicHeight || WidgetHeightLimits.MAX_HEIGHT_IN_ROWS) *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        transform: `translate3d(${
          (newDimensions.reflectPosition ? newDimensions.x : 0) -
          RESIZE_BORDER_BUFFER / 2
        }px,${
          (newDimensions.reflectPosition ? newDimensions.y : 0) -
          RESIZE_BORDER_BUFFER / 2
        }px,0)`,
      }}
    >
      {(_props) => (
        <ResizeWrapper
          $prevents={pointerEvents}
          className={props.className}
          id={`resize-${props.widgetId}`}
          inverted={props.topRow <= 2}
          isHovered={props.isHovered}
          ref={resizableRef}
          showBoundaries={props.showResizeBoundary}
          style={_props}
        >
          {props.children}
          {props.enableHorizontalResize && renderHandles}
        </ResizeWrapper>
      )}
    </Spring>
  );
}

export default ReflowResizable;
