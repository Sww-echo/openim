import { Modal, ModalProps } from "antd";
import { type ElementType, FC, memo, useRef, useState } from "react";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";

interface IDraggableModalWrapProps extends ModalProps {
  ignoreClasses?: string;
}

const DraggableComponent = Draggable as unknown as ElementType;

const DraggableModalWrap: FC<IDraggableModalWrapProps> = (props) => {
  const { children, ignoreClasses = "", ...modalProps } = props;
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  return (
    <Modal
      {...modalProps}
      modalRender={(modal) => (
        <DraggableComponent
          allowAnyClick
          cancel={ignoreClasses}
          bounds={bounds}
          onStart={onStart}
        >
          <div ref={draggleRef}>{modal}</div>
        </DraggableComponent>
      )}
    >
      {children}
    </Modal>
  );
};

export default memo(DraggableModalWrap);
