/* jshint esversion: 6 */
import React, { Component } from 'react';
import TextField     from '@material-ui/core/TextField';
import Button        from '@material-ui/core/Button';
import Dialog        from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle   from '@material-ui/core/DialogTitle';
import Snackbar      from '@material-ui/core/Snackbar';
import { InputList } from './InputList';

export class ItemDialog extends Component {

    constructor(props) {
        super(props);

        this.state = {
            item       : {},
            products   : [],
            productName: '',
            isLoaded   : false,
            toast      : { open: false, message: '' }
        };

        this.baseItem = this.state.item;
    }

    componentDidMount() {
        fetch('http://localhost:3001/api/products/')
        .then(res => res.json())
        .then(
            (result) => {
                this.setState({ isLoaded: true, products: result });
            },
            (error) => {
                this.setState({ isLoaded: true, error });
            }
        );
    }

    componentWillReceiveProps() {

        const item    = this.state.item;
        item.id       = this.props.item.s_id;
        item.client   = JSON.parse(localStorage.getItem('client')).id;
        item.product  = this.props.item.p_id;
        item.quantity = this.props.item.s_quantity;
        item.date     = this.getFormatedDate(this.props.item.s_date);
        item.payment  = this.props.item.s_payment;

        const productName = this.props.item.p_name;

        this.setState({ 'item': item, 'productName': productName });
    }

    getFormatedDate(date) {

        const d = date ? new Date(date) : new Date();

        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.toLocaleTimeString()}`;
    }

    render() {
        const { error, isLoaded, products} = this.state;

        if (error)
            return <div>Error: { error.message }</div>;

        else if (!isLoaded)
            return <div>Carregando...</div>;

        else {

            let inputs;

            if (this.state.item.quantity) {
                inputs =
                    <>
                    <InputList
                        value    ={ this.state.productName }
                        product  ={ this.state.item.product }
                        autoFocus={ true }
                        onChange ={ e => this.handleProductChange(e) }
                        onClick  ={ () => document.execCommand("selectall", null, false) }
                        listItems={ products }
                        required ={ true }
                        label    ="Produto" />

                    <TextField
                        value     ={ this.state.item.quantity }
                        onChange  ={ e => this.handleQuantityChange(e) }
                        onFocus   ={ e => e.currentTarget.select() }
                        label     ="Quantidade"
                        className ="upper"
                        type      ="number"
                        inputProps={{ min: '1', step: '1' }}
                        variant   ="outlined"
                        style     ={{ 'marginTop': '15px' }}
                        required
                        fullWidth  />
                    </>;
            } else {
                inputs =
                    <TextField
                        autoFocus ={ true }
                        onFocus   ={ () => document.execCommand("selectall", null, false) }
                        onChange  ={ e => this.handlePaymentChange(e) }
                        value     ={ this.state.item.payment || '' }
                        label     ="Quantia em R$"
                        className ="upper"
                        type      ="number"
                        inputProps={{ step: '0.01' }}
                        variant   ="outlined"
                        required
                        fullWidth />;
            }
            return (
                <>
                <Dialog open={ this.props.open }>
                    <DialogTitle>{ this.state.item.id ? 'Editar' : 'Adicionar' }</DialogTitle>
                    <form className="item__form-fields">
                        <DialogContent>{ inputs }</DialogContent>
                        <DialogActions>
                            <Button
                                color  ="primary"
                                type   ="submit"
                                onClick={ () => this.storeData() }>
                                SALVAR
                            </Button>
                            <Button
                                color  ="secondary"
                                onClick={ () => { this.props.close(); this.clearState(); }}>
                                CANCELAR
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
                <Snackbar
                    anchorOrigin    ={{ vertical: 'top', horizontal: 'right' }}
                    open            ={ this.state.toast.open }
                    onClose         ={ () => this.closeToast() }
                    message         ={ this.state.toast.message }
                    autoHideDuration={ 3500 } />
                </>
            )
        }
    };

    handlePaymentChange(e) {

        const item    = this.state.item;
        const payment = Number(e.target.value.replace(',','.'));

        item.payment = payment > 0 ? (payment * -1) : payment;
        item.product = 1; // This is a specific product only for payments
        this.setState({ 'item': item });
    }

    handleProductChange(e) {

        const productName   = e.target.value.toUpperCase();
        const productOption = productName ?
            document.querySelector('#items option[value="' + productName + '"]') : null;

        this.setState({ 'productName': productName });

        if (productOption) {
            const item   = this.state.item;
            item.product = productOption.dataset.key;

            this.setState({ 'item': item });
        }
    }

    handleQuantityChange(e) {

        if (!Number(e.target.value)) return;

        const item    = this.state.item;
        item.quantity = Number(e.target.value);

        this.setState({ 'item': item });
    }

    storeData() {

        if (!document.querySelector('.item__form-fields').checkValidity())
            return false;

        if (this.productNullOrHasSameIdAndDiferentNames()) {
                this.cantFindProduct();
                return false;
        }

        this.state.item.id ? this.updateSale() : this.saveSale();
    }

    productNullOrHasSameIdAndDiferentNames() {

        return !this.state.item.product ||
               (this.state.item.product === this.props.item.p_id &&
                this.state.productName !== this.props.item.p_name)
    }

    cantFindProduct() {

        const toast   = this.state.toast;
        toast.open    = true;
        toast.message = '❌ Produto não cadastrado!';

        this.setState({ 'toast': toast });
    }

    updateSale() {

        fetch('http://localhost:3001/api/sales/', {
            method : "PUT",
            body   : JSON.stringify(this.state.item),
            headers: { "Content-Type": "application/json" },
        })
        .then(res => res.json())
        .then(
            (result) => { this.handleResult(); },
            (error)  => { this.setState({ isLoaded: true, error }); }
        );
    }

    handleResult() {
        const toast   = this.state.toast;
        toast.open    = true;
        toast.message = '✔️ Salvo com sucesso!';

        const root = this;

        this.setState({ 'toast': toast }, () => {
            root.props.close();
            root.props.refresh();
        });

        this.clearState();
    }

    clearState() {
        this.setState({ item: this.baseItem, productName: '' });
    }

    saveSale() {

        fetch('http://localhost:3001/api/sales/', {
            method: "POST",
            body: JSON.stringify(this.state.item),
            headers: { "Content-Type": "application/json" },
        })
        .then(res => res.json())
        .then(
            (result) => { this.handleResult(); },
            (error)  => { this.setState({ isLoaded: true, error }); }
        );
    }

    closeToast() {
        const toast = this.state.toast;
        toast.open  = false;
        this.setState({ 'toast': toast });
    }
}