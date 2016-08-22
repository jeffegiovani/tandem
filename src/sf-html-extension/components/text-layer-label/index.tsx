
import './index.scss';

import * as cx from 'classnames';
import * as React from 'react';
import * as AutosizeInput from 'react-input-autosize';
import { SelectAction } from 'sf-front-end/actions';
import { LayerLabelComponentFactoryDependency } from "sf-front-end/dependencies";

class FocusComponent extends React.Component<any, any> {
  render() {
    return this.props.childNodes;
  }
}

class TextLayerLabelComponent extends React.Component<any, any> {

  constructor() {
    super();
    this.state = {
      edit: false
    };
  }

  editLabel() {
    this.setState({
      edit: true
    })
  }

  render() {

    var edit = this.state.edit && !!~this.props.app.selection.indexOf(this.props.entity);
    var connectDragSource = this.props.connectDragSource;

    return connectDragSource(<span
      className='m-label m-text-layer-label'
      onDoubleClick={this.editLabel.bind(this)}>
      {
        this.state.edit         ?
        this.renderInput()      :
        this.props.entity.nodeValue
      }
    </span>);
  }

  onInputChange(event) {
    this.props.entity.setProperties({
      value: event.target.nodeValue
    });
  }

  doneEditing() {
    this.setState({ edit: false });
  }

  onInputKeyDown(event) {
    if (event.keyCode === 13) {
      this.doneEditing();
    }
  }

  onInputFocus(event) {
    event.target.select();
  }

  renderInput() {
    return <FocusComponent><AutosizeInput
      type='text'
      className='m-layer-label-input'
      onFocus={this.onInputFocus.bind(this)}
      value={this.props.entity.value}
      onChange={this.onInputChange.bind(this)}
      onBlur={this.doneEditing.bind(this)}
      onKeyDown={this.onInputKeyDown.bind(this)}
      /></FocusComponent>;
  }
}

export const dependency = new LayerLabelComponentFactoryDependency("text", TextLayerLabelComponent);