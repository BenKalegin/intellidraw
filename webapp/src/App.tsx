import React, {RefObject} from 'react';
import './App.css';
import {Stage, Layer, Rect, Transformer} from 'react-konva';
import Konva from "konva";


interface RectAttrs {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    id: string;
}

interface RectProps {
    shapeProps: RectAttrs;
    isSelected: boolean;
    onSelect: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
    onChange: (newAttrs: RectAttrs) => void;
}

const Rectangle = (props: RectProps) => {
    const shapeRef: RefObject<Konva.Rect> = React.useRef(null);
    const trRef: RefObject<Konva.Transformer> = React.useRef(null);

    React.useEffect(() => {
        if (props.isSelected) {
            // we need to attach transformer manually
            // @ts-ignore
            trRef.current.nodes([shapeRef.current]);
            // @ts-ignore
            trRef.current.getLayer().batchDraw();
        }
    }, [props.isSelected]);

    return (
        <React.Fragment>
            <Rect
                onClick={props.onSelect}
                ref={shapeRef}
                {...props.shapeProps}
                draggable
                onDragEnd={(e) => {
                    props.onChange({
                        ...props.shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={() => {
                    // transformer is changing scale of the node
                    // and NOT its width or height
                    // but in the store we have only width and height
                    // to match the data better we will reset scale on transform end
                    const node = shapeRef.current!;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    // we will reset it back
                    node.scaleX(1);
                    node.scaleY(1);
                    props.onChange({
                        ...props.shapeProps,
                        x: node.x(),
                        y: node.y(),
                        // set minimal value
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(node.height() * scaleY),
                    });
                }}
            />
            {props.isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // limit resize
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </React.Fragment>
    );
};

const initialRectangles: RectAttrs[] = [
    {
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        fill: 'red',
        id: 'rect1',
    },
    {
        x: 150,
        y: 150,
        width: 100,
        height: 100,
        fill: 'green',
        id: 'rect2',
    },
];

function App() {
    const [rectangles, setRectangles] = React.useState(initialRectangles);
    const [selectedId, selectShape] = React.useState<string | null>(null);

    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }
    };

    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={checkDeselect}
        >
            <Layer>
                {rectangles.map((rect, i) => {
                    return (
                        <Rectangle
                            key={i}
                            shapeProps={rect}
                            isSelected={rect.id === selectedId}
                            onSelect={() => {
                                selectShape(rect.id);
                            }}
                            onChange={(newAttrs: RectAttrs) => {
                                const rects = rectangles.slice();
                                rects[i] = newAttrs;
                                setRectangles(rects);
                            }}
                        />
                    );
                })}
            </Layer>
        </Stage>
    );
}

export default App;
