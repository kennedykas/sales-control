/* jshint esversion: 6 */
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import Snackbar from '@material-ui/core/Snackbar'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import ManageResponse from '../pages/common/ManageResponse'
import fetch from '../pages/common/fetchWithTimeout'

export class Login extends Component {
    constructor (props) {
        super(props)
        this.state = {
            user: {
                email: '',
                password: ''
            },
            toast: { open: false, message: '' }
        }
    }

    render () {
        return (
            <section className = "login">
                <div className = "login-fields">
                    <TextField
                        id = "email"
                        label = "Email"
                        value = { this.state.email }
                        onChange = { event => this.setUser('email', event) }
                        variant = "outlined" />
                    <TextField
                        type = "password"
                        id = "outlined-basic"
                        onKeyDown ={ e => this.checkKey(e) }
                        label = "Senha"
                        value = { this.state.password }
                        onChange = { event => this.setUser('password', event) }
                        variant = "outlined" />
                    <Button
                        variant = "outlined"
                        color = "primary"
                        onClick={ () => this.login() }>
                        LOGAR
                    </Button>
                </div>
                <Snackbar
                    anchorOrigin = {{ vertical: 'top', horizontal: 'right' }}
                    open = { this.state.toast.open }
                    onClose = { () => this.closeToast() }
                    message = { this.state.toast.message }
                    autoHideDuration = { 3500 } />
            </section>
        )
    }

    checkKey (e) {
        if (e.key === 'Enter') this.login()
    }

    setUser (key, event) {
        const user = this.state.user
        user[key] = event.target.value
        this.setState({ user: user })
    }

    login () {
        fetch('http://localhost:3000/auth/authenticate', {
            method: 'POST',
            body: JSON.stringify(this.state.user),
            headers: { 'Content-Type': 'application/json' }
        }, 7000)
        .then(res => ManageResponse.checkStatusCode(res))
        .then(
            (result) => { this.handleResult(result) },
            () => { this.handleResult() }
        )
    }

    closeToast () {
        const toast = this.state.toast
        toast.open = false
        this.setState({ toast: toast })
    }

    handleResult (result) {
        if (result) {
            const toast = this.state.toast
            toast.open = true
            toast.message = result.error ? result.error : result.success
            this.setState({ toast: toast })
            if (result.tonken) this.saveToken(result)
        } else {
            this.setState({ fetching: false })
            const toast = this.state.toast
            toast.open = true
            toast.message = 'Problemas na comunicação.'
            this.setState({ toast: toast })
        }
    }

    saveToken (result) {
        sessionStorage.setItem('authToken', `Bearer ${result.tonken}`)
        this.props.history.push('/')
        return false
    }
}

export default withRouter(Login)
