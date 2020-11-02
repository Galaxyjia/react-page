import classNames from 'classnames';
import * as React from 'react';
import { useMeasure } from 'react-use';
import { isRow, Row } from '../../types/editable';
import Cell from '../Cell';
import {
  useBlurAllCells,
  useIsResizeMode,
  useNodeHoverPosition,
  useNodeProps,
  useOptions,
  useResizeCellById,
} from '../hooks';
import Droppable from './Droppable';
import Draggable from 'react-draggable';

const Row: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const [ref, { width }] = useMeasure();

  const blurAllCells = useBlurAllCells();
  const resize = useResizeCellById();

  const hoverPosition = useNodeHoverPosition(nodeId);

  const childrenWithSizes = useNodeProps(nodeId, (node) =>
    isRow(node)
      ? node.cells?.map((c) => ({ id: c.id, size: c.size })) ?? []
      : node.rows?.map((r) => ({ id: r.id, size: 12 })) ?? []
  );

  const childrenWithOffsets = childrenWithSizes.reduce(
    (acc, { id, size }, index) => [
      ...acc,
      {
        id,
        offset: size + (acc[index - 1]?.offset ?? 0),
      },
    ],
    [] as { offset: number; id: string }[]
  );
  const rowHasInlineChildrenPosition = useNodeProps(
    nodeId,
    (node) => isRow(node) && node.cells.length === 2 && node.cells[0]?.inline
  );

  const stepWidth = Math.round(width / 12);
  const { allowResizeInEditMode } = useOptions();
  const isResizeMode = useIsResizeMode();
  return (
    <Droppable nodeId={nodeId}>
      <div
        ref={ref}
        className={classNames('ory-row', {
          'ory-row-is-hovering-this': Boolean(hoverPosition),
          [`ory-row-is-hovering-${hoverPosition || ''}`]: Boolean(
            hoverPosition
          ),
          'ory-row-has-floating-children': Boolean(
            rowHasInlineChildrenPosition
          ),
        })}
        style={{ position: 'relative' }}
        onClick={blurAllCells}
      >
        {childrenWithOffsets.map(({ offset, id }, index) => (
          <React.Fragment key={id}>
            <Cell nodeId={id} rowWidth={width} key={id} />

            {index < childrenWithOffsets.length - 1 &&
            (isResizeMode || allowResizeInEditMode) ? (
              <Draggable
                bounds={{
                  top: 0,
                  bottom: 0,
                  left: stepWidth,
                  right: width - stepWidth,
                }}
                position={{
                  x:
                    rowHasInlineChildrenPosition === 'right'
                      ? stepWidth * (12 - offset)
                      : stepWidth * offset,
                  y: 0,
                }}
                axis="x"
                onDrag={(e, data) => {
                  const newSize = Math.round(
                    (rowHasInlineChildrenPosition === 'right'
                      ? width - data.x
                      : data.x) / stepWidth
                  );
                  resize(id, newSize);
                }}
                grid={[stepWidth, 0]}
              >
                <div className="resize-handle"></div>
              </Draggable>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </Droppable>
  );
};

export default React.memo(Row);
