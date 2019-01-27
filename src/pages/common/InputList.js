import React, { Component } from 'react';
import TextField  from '@material-ui/core/TextField';

export class InputList extends Component {

    componentDidMount () {
        const script = document.createElement('script');
        script.async = true;
        script.text  = `document.getElementById('list').setAttribute('list', 'items')`;

        document.body.appendChild(script);
    }

    render() {
        return (
            <div>
                <TextField
                    value    ={ this.props.value }
                    onKeyUp  ={ this.props.onKeyUp }
                    onKeyDown={ this.props.onKeyDown }
                    onClick  ={ this.props.onClick }
                    onChange ={ this.props.onChange }
                    autoFocus={ this.props.autoFocus }
                    label    ={ this.props.label }
                    required ={ this.props.required }
                    id       ="list"
                    className="upper"
                    type     ="text"
                    variant  ="outlined"
                    autoComplete="off"
                    fullWidth />

                <datalist id="items">
                    {this.props.listItems.map(function(object, i){
                        return <option key={ i } value={ object.name } data-key={ object.id } />;
                    })}
                </datalist>
            </div>
        )
    }

    // setOptionById(id) {
    //     if (id) {
    //         const $list = document.getElementById('list');
    //         $list.value = document.querySelector('#items option[data-key="' + id + '"]').value;
    //     }
    // }
}