/* jshint esversion: 6 */
import React, { Component } from 'react'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Snackbar from '@material-ui/core/Snackbar'
import NavLink from 'react-router-dom/NavLink'
import PersonAdd from '@material-ui/icons/PersonAdd'
import ManageResponse from './common/ManageResponse'

export class Customer extends Component {
    constructor (props) {
        super(props)
        this.state = {
            client: { _id: null, name: '', phone: '', email: '', createdAt: '' },
            isLoaded: false,
            toast: { open: false, message: '' }
        }
    }

    componentDidMount () {
        this.setState(
            { client: JSON.parse(localStorage.getItem('client')) },
            () => {
                if (this.state.client._id) {
                    fetch(`${process.env.REACT_APP_API_URL}/api/user?id=${this.state.client._id}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
                    })
                    .then(res => {
                        return ManageResponse.checkStatusCode(res)
                    })
                    .then(
                        (result) => {
                            this.setState({ isLoaded: true, client: result })
                        },
                        () => { this.handleResult() }
                    )
                } else {
                    this.setClient()
                    this.setState({ isLoaded: true })
                }
            }
        )
    }

    render () {
        const { error, isLoaded, client } = this.state
        if (error) return <div>Error: { error.message }</div>
        else if (!isLoaded) return <div>Carregando...</div>
        else {
            return (
            <section className="customer">
                <header><h2><PersonAdd /> Cliente</h2></header>

                <form className="customer__form-fields">
                    <TextField
                        id ="client-name"
                        className ="upper"
                        label ="Nome Completo"
                        variant = "outlined"
                        inputProps = {{ pattern: '.{3,}' }}
                        autoFocus = { client.name === '' }
                        value = { this.state.client.name }
                        onChange = { e => this.setClient('name', e.target.value) }
                        required />

                    <TextField
                        type ="number"
                        label = "Celular"
                        variant = "outlined"
                        autoFocus = { client.name !== '' }
                        value = { this.state.client.phone }
                        onChange = { e => this.setClient('phone', e.target.value) } />

                    <TextField
                        type = "email"
                        label = "E-mail"
                        variant = "outlined"
                        value = { client.email }
                        onChange = { e => this.setClient('email', e.target.value) } />

                    <div className = "actions">
                        <Button
                            variant = "outlined"
                            color = "primary"
                            type = "submit"
                            onClick = { e => this.storeData(e) }>
                            SALVAR
                        </Button>
                        <NavLink to="/" tabIndex="-1">
                            <Button variant="outlined" color="secondary">
                                CANCELAR
                            </Button>
                        </NavLink>
                        {
                            this.state.client._id ?
                            <Button
                            variant = "outlined"
                            color = "secondary"
                            type = "submit"
                            onClick = { e => this.deleteCustomer(e) }>
                            EXCLUIR
                            </Button> : ''

                        }
                    </div>
                </form>

                <Snackbar
                    anchorOrigin = {{ vertical: 'top', horizontal: 'right' }}
                    open = { this.state.toast.open }
                    message = { this.state.toast.message }
                    autoHideDuration = { 3500 } />
            </section>
            )
        }
    }

    storeData (e) {
        e.preventDefault()
        localStorage.setItem('client', JSON.stringify(this.state.client))
        if (!document.querySelector('.customer__form-fields').checkValidity()) return false
        this.state.client._id ? this.updateClient() : this.saveClient()
    }

    deleteCustomer (e) {
        fetch(`${process.env.REACT_APP_API_URL}/api/user/`, {
            method: 'DELETE',
            body: JSON.stringify(this.state.client),
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

    saveClient () {
        fetch(`${process.env.REACT_APP_API_URL}/api/user/`, {
            method: 'POST',
            body: JSON.stringify(this.state.client),
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
            this.setState({ toast: toast }, () => {
                setTimeout(() => {
                    this.props.history.push('/')
                }, 500)
            })
        } else {
            this.setState({ fetching: false })
            const toast = this.state.toast
            toast.open = true
            toast.message = 'Problemas na comunicação.'
            this.setState({ toast: toast })
        }
    }

    updateClient () {
        fetch(`${process.env.REACT_APP_API_URL}/api/user/`, {
            method: 'PUT',
            body: JSON.stringify(this.state.client),
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        })
        .then(res => { return ManageResponse.checkStatusCode(res) })
        .then(
            result => { this.handleResult(result) },
            () => { this.handleResult() }
        )
    }

    setClient (key, value) {
        const client = this.state.client
        if (key) client[key] = value.toUpperCase()
        this.setState({ client: client })
    }
}
