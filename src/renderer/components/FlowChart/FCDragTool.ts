/*
*  Copyright (C) 1998-2019 by Northwoods Software Corporation. All Rights Reserved.
*/

import go from 'gojs';

/**
 * The NonRealtimeDraggingTool class lets the user drag an image instead of actually moving any selected nodes,
 * until the mouse-up event.
 *
 * If you want to experiment with this extension, try the <a href="../../extensionsTS/NonRealtimeDragging.html">Non Realtime Dragging</a> sample.
 * @category Tool Extension
 */
export class FCDiagramDragTool extends go.DraggingTool {
  private _imagePart: go.Part | null = null;  // a Part holding a translucent image of what would be dragged
  private _ghostDraggedParts: go.Map<go.Part, go.DraggingInfo> | null = null;  // a Map of the _imagePart and its dragging information
  private _originalDraggedParts: go.Map<go.Part, go.DraggingInfo> | null = null;  // the saved normal value of DraggingTool.draggedParts

  /**
   * Call the base method, and then make an image of the returned collection,
   * show it using a Picture, and hold the Picture in a temporary Part, as _imagePart.
   * @param {Iterable.<Part>} parts A {@link Set} or {@link List} of {@link Part}s.
   * @return {Map.<Part,DraggingInfo>}
   */
  public computeEffectiveCollection(coll: go.Iterable<go.Part>): go.Map<go.Part, go.DraggingInfo> {
    const map = super.computeEffectiveCollection(coll, this.dragOptions);
    if (this.isActive && this._imagePart === null) {
      const bounds = this.diagram.computePartsBounds(map.toKeySet());
      const offset = this.diagram.lastInput.documentPoint.copy().subtract(bounds.position);
      const $ = go.GraphObject.make;
      this._imagePart =
        $(go.Part,
          { layerName: 'Tool', opacity: 0.5, locationSpot: new go.Spot(0, 0, offset.x, offset.y) },
          $(go.Picture,
            { element: this.diagram.makeImage({ parts: map.toKeySet() }) })
        );
    }
    return map;
  }

  /**
   * When activated, replace the {@link #draggedParts} with the ghost dragged parts, which
   * consists of just one Part, the image, added to the Diagram at the current mouse point.
   */
  public doActivate(): void {
    super.doActivate();
    if (this._imagePart !== null) {
      this._imagePart.location = this.diagram.lastInput.documentPoint;
      this.diagram.add(this._imagePart);
      this._originalDraggedParts = this.draggedParts;
      this._ghostDraggedParts = super.computeEffectiveCollection(new go.List<go.Part>().add(this._imagePart), this.dragOptions);
      this.draggedParts = this._ghostDraggedParts;
    }
  }

  /**
   * When deactivated, make sure any image is removed from the Diagram and all references are cleared out.
   */
  public doDeactivate(): void {
    if (this._imagePart !== null) {
      this.diagram.remove(this._imagePart);
    }
    this._imagePart = null;
    this._ghostDraggedParts = null;
    this._originalDraggedParts = null;
    super.doDeactivate();
  }

  /**
   * Do the normal mouse-up behavior, but only after restoring {@link #draggedParts}.
   */
  public doMouseUp(): void {
    if (this._originalDraggedParts !== null) {
      this.draggedParts = this._originalDraggedParts;
    }
    super.doMouseUp();
  }

  /**
   * If the user changes to "copying" mode by holding down the Control key,
   * return to the regular behavior and remove the image.
   */
  public doKeyDown(): void {
    if (this._imagePart !== null && this._originalDraggedParts !== null &&
      (this.diagram.lastInput.control || this.diagram.lastInput.meta) && this.mayCopy()) {
      this.draggedParts = this._originalDraggedParts;
      this.diagram.remove(this._imagePart);
    }
    super.doKeyDown();
  }

  /**
   * If the user changes back to "moving" mode,
   * show the image again and go back to dragging the ghost dragged parts.
   */
  public doKeyUp(): void {
    if (this._imagePart !== null && this._ghostDraggedParts !== null && this.mayMove()) {
      this._imagePart.location = this.diagram.lastInput.documentPoint;
      this.diagram.add(this._imagePart);
      this.draggedParts = this._ghostDraggedParts;
    }
    super.doKeyUp();
  }
}
