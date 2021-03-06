/* jshint esversion: 6 */
import React, { Component } from 'react'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import Snackbar from '@material-ui/core/Snackbar'
import { InputList } from './InputList'
import ManageResponse from './ManageResponse'
import DialogContentText from '@material-ui/core/DialogContentText'
import CircularProgress from '@material-ui/core/CircularProgress'

export class ItemDialog extends Component {
    constructor (props) {
        super(props)
        this.state = {
            fetching: false,
            item: {},
            cleaningUp: false,
            products: [],
            productName: '',
            isLoaded: false,
            toast: { open: false, message: '' },
            hiddenButton: false
        }
        this.baseItem = this.state.item
    }

    componentDidMount () {
        this.getProducts()
    }

            getProducts (page) {
                let p = page ? page : 1
                fetch(`${process.env.REACT_APP_API_URL}/api/products?page=${p}&limit=5`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
                })
                .then(res => { return ManageResponse.checkStatusCode(res) })
                .then(
                    (result) => {
                        if (result.length) {
                            result.forEach(product => {
                                product.name = product.descrition
                            })
                            let products = this.state.products
                            products = products.concat(result)
                            this.setState({ products: products }, () => { this.getProducts(++p) })
                        } else {
                            let products = this.state.products
                            products = products.concat(result)
                            this.setState({ isLoaded: true, fetching: true, products: products })
                        }
                    },
                    () => { this.handleResult() }
                )
            }

    componentWillReceiveProps () {
        const item = this.state.item
        item.customer = JSON.parse(localStorage.getItem('client'))._id
        item.amount = this.props.item.amount
        item.product = this.props.item.product
        item.paymentAmount = this.props.item.paymentAmount
        item._id = this.props.item._id
        this.setState({ productName: this.props.item._id && this.props.item.product ? this.props.item.product.descrition : '' })
        this.setState({hiddenButton: this.props.item._id ? true : false})
        this.setState({ item: item })
    }

    getFormatedDate (date) {
        const d = date ? new Date(date) : new Date()
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.toLocaleTimeString()}`
    }

    render () {
        const { error, isLoaded, products } = this.state
        if (error) return <div>Error: { error.message }</div>
        else {
            let inputs
            if (this.state.item.amount) {

                inputs =
                    <>
                    <InputList
                        value = { this.state.productName }
                        autoFocus = { true }
                        onChange = { e => this.handleProductChange(e) }
                        onClick = { () => document.execCommand('selectall', null, false) }
                        listItems ={ products }
                        required = { true }
                        label = "Produto"/>

                    <TextField
                        value = { this.state.item.amount }
                        onChange = { e => this.handleQuantityChange(e) }
                        onFocus = { e => e.currentTarget.select() }
                        label = "Quantidade"
                        className = "upper"
                        type = "number"
                        inputProps = {{ min: '1', step: '1' }}
                        variant = "outlined"
                        style = {{ marginTop: '15px' }}
                        required
                        fullWidth />
                    </>
            } else {
                inputs =
                    <TextField
                        autoFocus ={ true }
                        onFocus = { () => document.execCommand('selectall', null, false) }
                        onChange = { e => this.handlePaymentChange(e) }
                        value = { this.state.item.paymentAmount || '' }
                        label = "Quantia em R$"
                        className = "upper"
                        type = "number"
                        inputProps = {{ step: '0.01' }}
                        variant = "outlined"
                        required
                        fullWidth />
            }
            return (
                <>
                <Dialog open={ this.props.open }>
                    <DialogTitle>
                        { this.state.item._id ? 'Editar' : 'Adicionar' }
                        {
                            this.state.fetching ?
                            '' :
                            <CircularProgress
                            style={{ margin: '0 0', position: 'absolute', color: '#f50057' }} size={20} />
                        }
                    </DialogTitle>
                    <form className="item__form-fields">
                        <DialogContent>{ inputs }</DialogContent>
                        <DialogActions>
                            <Button
                                color = "primary"
                                type = "submit"
                                onClick = { () => this.storeData() }>
                                SALVAR
                            </Button>
                            <Button
                                color = "secondary"
                                onClick={ () => { this.props.close(); this.clearState(); }}>
                                CANCELAR
                            </Button>
                            {this.state.hiddenButton ?
                                <Button
                                    color = "secondary"
                                    onClick={ () => { this.toggleClearDialog() }}>
                                    EXCLUIR
                                </Button> : ''
                            }
                        </DialogActions>
                    </form>
                </Dialog>
                <Dialog open = { this.state.cleaningUp }>
                    <DialogTitle>{this.state.item.product ? 'Deletar venda' : 'Cancelar pagamento' }</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                        {this.state.item.product ? 'Deletar esta venda?' : 'Cancelar este pagamento?' }
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick = { () => this.toggleClearDialog() }
                            color = "secondary" autoFocus={ true }>
                            CANCELAR
                        </Button>
                        <Button onClick = { () => this.deleteSale() } color="primary">
                            EXCLUIR
                        </Button>
                    </DialogActions>
                </Dialog>
                <Snackbar
                    anchorOrigin = {{ vertical: 'top', horizontal: 'right' }}
                    open = { this.state.toast.open }
                    onClose = { () => this.closeToast() }
                    message = { this.state.toast.message }
                    autoHideDuration = { 3500 } />
                </>
            )
        }
    }

    toggleClearDialog () {
        this.setState({ cleaningUp: !this.state.cleaningUp })
        const root = this
        setTimeout(() => root.setState({ cleaningUp: false }), 5000)
    }

    handlePaymentChange (e) {
        const item = this.state.item
        const paymentAmount = Number(e.target.value.replace(',', '.'))
        item.paymentAmount = paymentAmount > 0 ? (paymentAmount * -1) : paymentAmount
        this.setState({ item: item })
    }

    handleProductChange (e) {
        const productName = e.target.value.toUpperCase()
        const productOption = productName ?
            document.querySelector(`#items option[value="${productName}"]`) : null
        this.setState({ productName: productName })
        if (productOption) {
            const item = this.state.item
            item.product = productOption.dataset.key
            this.setState({ item: item })
        }
    }

    handleQuantityChange (e) {
        if (!Number(e.target.value)) return
        const item = this.state.item
        item.amount = Number(e.target.value)
        this.setState({ item: item })
    }

    storeData () {
        if (!document.querySelector('.item__form-fields').checkValidity()) return false
        if (this.productNullOrHasSameIdAndDiferentNames() && !this.state.item.paymentAmount) {
            this.cantFindProduct()
                return false
        }
        this.state.item._id && this.state.item.product ? this.updateSale() : this.state.item._id ? this.updatePayment() : this.saveSale()
    }

    productNullOrHasSameIdAndDiferentNames () {
        return !this.state.item.product ||
               (this.state.item.product === this.props.item._id &&
                this.state.productName !== this.props.item.descrition)
    }

    cantFindProduct () {
        const toast = this.state.toast
        toast.open = true
        toast.message = '❌ Produto não     !'
        this.setState({ toast: toast })
    }

    deleteSale () {
        this.toggleClearDialog()
        fetch(`${process.env.REACT_APP_API_URL}/api/bills/`, {
            method: 'DELETE',
            body: JSON.stringify({ id: this.state.item._id }),
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        })
        .then(res => ManageResponse.checkStatusCode(res))
        .then(
            result => { this.handleResult(result) },
            () => { this.handleResult() }
        )
    }

    saveSale () {
        fetch(`${process.env.REACT_APP_API_URL}/api/bills/`, {
            method: 'POST',
            body: JSON.stringify(this.state.item),
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        })
        .then(res => ManageResponse.checkStatusCode(res))
        .then(
            result => { this.handleResult(result) },
            () => { this.handleResult() }
        )
    }

    updateSale () {
        fetch(`${process.env.REACT_APP_API_URL}/api/bills/`, {
            method: 'PUT',
            body: JSON.stringify({
                id: this.state.item._id,
                customer: this.state.item.customer,
                product: this.state.item.product,
                amount: this.state.item.amount
            }),
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        })
        .then(res => ManageResponse.checkStatusCode(res))
        .then(
            result => { this.handleResult(result) },
            () => { this.handleResult() }
        )
    }

    updatePayment () {
        fetch(`${process.env.REACT_APP_API_URL}/api/bills/`, {
            method: 'PUT',
            body: JSON.stringify({
                id: this.state.item._id,
                customer: this.state.item.customer,
                paymentAmount: this.state.item.paymentAmount
            }),
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        })
        .then(res => ManageResponse.checkStatusCode(res))
        .then(
            result => { this.handleResult(result) },
            () => { this.handleResult() }
        )
    }

    handleResult (result) {
        if (result) {
            const root = this
            this.setState({ fetching: false })
            const toast = this.state.toast
            toast.open = true
            toast.message = result.error ? result.error : result.success
            this.setState({ toast: toast }, () => {
                root.props.close()
                root.props.refresh()
            })
            this.clearState()
            this.componentDidMount()
        } else {
            this.setState({ fetching: false })
            const toast = this.state.toast
            toast.open = true
            toast.message = 'Problemas na comunicação.'
            this.setState({ toast: toast })
            this.clearState()
        }
    }

    clearState () {
        this.setState({ item: this.baseItem, productName: '', products: [] })
    }

    closeToast () {
        const toast = this.state.toast
        toast.open = false
        this.setState({ toast: toast })
    }
}
