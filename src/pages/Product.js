/* jshint esversion: 6 */
import React, { Component } from 'react'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import Snackbar from '@material-ui/core/Snackbar'
import DeleteIcon from '@material-ui/icons/Delete'
import ClearIcon from '@material-ui/icons/Clear'
import SaveIcon from '@material-ui/icons/Save'
import CircularProgress from '@material-ui/core/CircularProgress'
import ManageResponse from './common/ManageResponse'

export class Product extends Component {
    constructor (props) {
        super(props)
        this.state = {
            isLoaded: false,
            fetching: false,
            toast: { open: false, message: '' },
            products: [],
            product: { _id: null, descrition: '', price: '', code: '' },
            selectedRow: undefined
        }
        this.intl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
        this.keyboardShortcuts()
    }

    componentDidMount () {
        this.unselectRows()
        this.setState({ products: [] }, () => { this.getProducts() })
    }

    getProducts (page) {
        let p = page ? page : 1
        fetch(`${process.env.REACT_APP_API_URL}/api/products?page=${p}&limit=10`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        })
        .then(res => {
            return ManageResponse.checkStatusCode(res)
        })
        .then(
            result => {
                if (result.length) {
                    let products = this.state.products
                    products = products.concat(result)
                    this.setState({ products: products }, () => { this.getProducts(++p) })
                } else {
                    this.setState({ isLoaded: true })
                }
            },
            () => { this.handleResult() }
        )
    }

    render () {
        const { error, isLoaded, products } = this.state
        const root = this
        if (error) return <div>Error: { error.message }</div>
        else if (!isLoaded) return <div>Carregando...</div>
        else {
            return (
            <section className="products">
                <header><h2>{ this.state.products.length } Produtos</h2></header>
                <Paper className="products__list">
                    <Table>
                        <TableHead>
                        <TableRow>
                            <TableCell>Nome</TableCell>
                            <TableCell align="right">Unitário (R$)</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                            products.map((product, i) => {
                                return (
                                    <TableRow
                                        onClick = { e => root.editRowInfo(i) }
                                        selected= { root.state.selectedRow === i }
                                        hover = { true }
                                        key = { i }>
                                        <TableCell>{ product.descrition }</TableCell>
                                        <TableCell align="right">{ root.intl2.format(product.price) }</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </Paper>

                <form className="products__form-fields">
                    <TextField
                        label = "Nome do produto"
                        className = "upper"
                        variant = "outlined"
                        autoFocus = { true }
                        value ={ this.state.product.descrition }
                        onChange = { e => this.setProduct('descrition', e) }
                        inputProps = {{ pattern: '.{3,}' }}
                        required />

                    <TextField
                        label = "Valor unitário"
                        className = "upper"
                        variant = "outlined"
                        type = "number"
                        value = { this.state.product.price }
                        onChange = { e => this.setProduct('price', e) }
                        onKeyDown = { e => this.saveOnEnter(e) }
                        inputProps = {{ min: '0.01', step: '0.01' }}
                        required />

                    <TextField
                        label = "Código"
                        className = "upper"
                        variant = "outlined"
                        value ={ this.state.product.code }
                        onChange = { e => this.setProduct('code', e) }
                        inputProps = {{ pattern: '.{3,}' }}
                    />

                    <div className = "actions">
                        <Button
                            variant = "outlined"
                            color = "secondary"
                            disabled = { !this.state.product._id }
                            onClick = { () => this.deleteProduct(root.state.product._id) }>
                            {
                                this.state.fetching ?
                                <CircularProgress
                                style={{ position: 'absolute', color: '#f50057' }} size={20} /> :
                                <DeleteIcon />
                            }
                        </Button>

                        <Button
                            variant = "outlined"
                            color = "secondary"
                            disabled = { !this.state.product._id }
                            onClick = { () => this.clearState() }>
                            <ClearIcon />
                        </Button>

                        <Button
                            variant = "outlined"
                            color = "primary"
                            type = "submit"
                            onClick = { e => this.storeData(e) }>
                            <SaveIcon />
                        </Button>
                    </div>
                </form>

                <Snackbar
                    anchorOrigin = {{ vertical: 'top', horizontal: 'right' }}
                    open = { this.state.toast.open }
                    onClose = { () => this.closeToast() }
                    message = { this.state.toast.message }
                    autoHideDuration = { 3500 } />
            </section>
            )
        }
    }

    editRowInfo (i) {
        const product = this.state.products[i]
        if (this.state.products[i]) {
            this.setState({ product: product })
        }
    }

    setProduct (key, e) {
        const product = this.state.product
        product[key] = e.target.value.toUpperCase()
        this.setState({ product: product })
    }

    saveOnEnter (e) {
        if (e.key === 'Enter') this.storeData(e)
    }

    storeData (e) {
        if (!document.querySelector('.products__form-fields').checkValidity()) return false
        this.state.product._id ? this.updateProduct() : this.saveProduct()
        e.preventDefault()
    }

    saveProduct () {
        fetch(`${process.env.REACT_APP_API_URL}/api/products/`, {
            method: 'POST',
            body: JSON.stringify(this.state.product),
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        })
        .then(res => {
            return ManageResponse.checkStatusCode(res)
        })
        .then(
            (result) => { this.handleResult(result) },
            () => { this.handleResult() }
        )
    }

    updateProduct () {
        fetch(`${process.env.REACT_APP_API_URL}/api/products/`, {
            method: 'PUT',
            body: JSON.stringify(this.state.product),
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        })
        .then(res => {
            return ManageResponse.checkStatusCode(res)
        })
        .then(
            result => { this.handleResult(result) },
            () => { this.handleResult() }
        )
    }

    handleResult (result) {
        if (result) {
            this.setState({ fetching: false })
            const toast = this.state.toast
            toast.open = true
            toast.message = result.error ? result.error : result.success
            this.setState({ toast: toast })
            this.componentDidMount()
            this.clearState()
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
        this.setState({ product: { _id: null, descrition: '', price: '', code: '' } })
    }

    closeToast () {
        const toast = this.state.toast
        toast.open = false
        this.setState({ toast: toast })
    }

    deleteProduct () {
        fetch(`${process.env.REACT_APP_API_URL}/api/products`, {
            method: 'DELETE',
            body: JSON.stringify(this.state.product),
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        }).then(res => {
            return ManageResponse.checkStatusCode(res)
        })
        .then(
            result => { this.handleResult(result) },
            () => { this.handleResult() }
        )
    }

    keyboardShortcuts () {
        const root = this
        document.addEventListener('keydown', e => {
            if (e.srcElement.baseURI.includes('products')) {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') root.manageSelectedRow(e.key)
                else if (e.key === 'Enter') root.openRowDetails(e)
            }
        })
    }

    manageSelectedRow (key) {
        if (key === 'ArrowUp') {
            if (this.state.selectedRow > 0) {
                this.setState({ selectedRow: this.state.selectedRow - 1 })
            }
        } else if (this.state.selectedRow === undefined) {
            this.setState({ selectedRow: 0 })
        } else {
            if (this.state.selectedRow < (this.state.products.length - 1)) {
                this.setState({ selectedRow: this.state.selectedRow + 1 })
            }
        }
    }

    openRowDetails (e) {
        if (!this.state.managingItem && this.state.selectedRow) {
            e.preventDefault()
            const tbody = document.querySelector('tbody')
                if (tbody) {
                    tbody.children[this.state.selectedRow].children[0].click()
                    document.querySelector('.upper input').focus()
                    this.setState({ selectedRow: undefined })
                }
        }
    }

    unselectRows () {
        this.setState({ selectedRow: undefined })
    }
}
