import { div, form, button, input, a, span, p, strong, h2, img, small } from '@cycle/dom'
import Big from 'big.js'
import { showDesc, formGroup, yaml, amountField, omitKey, qrinv, fmtFiatAmount, fmtAmountWithAlt } from './util'

// Display a remote offer for us to send a payment
// Offers with quantity but no fixed amount are unsupported (rejected by the server side),
// so the user will be promoted for either the amount or the quantity, never both.
const offerPay = offer => ({ unitf, amtData, offerPayQuantity, conf: { expert } }) =>
  form('.offer-pay', { attrs: { do: 'offer-pay' }, dataset: offer }, [
    h2('Send payment')

  , offer.vendor != null ? p([ 'Vendor: ', span('.text-muted.break-word', offer.vendor) ]) : ''

  , showDesc(offer) ? p([ 'Description: ', span('.text-muted.break-word', offer.description) ]) : ''

  ,
    // Bitcoin denominated amount
    offer.msatoshi
    ? p('.toggle-unit', [ offer.quantity_min ? 'Price per unit: ' : 'Amount: '
      , fmtAmountWithAlt(offer.msatoshi, unitf) ])

    // Fiat denominated amount
    : offer.currency
    ? div('.form-group', [
        p('.mb-0', [ offer.quantity_min ? 'Price per unit: ' : 'Quoted amount: '
        , strong(fmtFiatAmount(offer)) ])
      , small('.form-text.text-muted', [ strong('Informative only.'), ' The final BTC amount will be displayed for confirmation on the next screen.' ])
      ])

    // Amount chosen by the payer
    : formGroup('Enter amount to pay:', amountField(amtData, 'custom_msat', true))

  , offer.quantity_min != null ? formGroup('Quantity:'
    , input('.form-control.form-control-lg', { attrs: { type: 'number', name: 'quantity', value: offerPayQuantity
                                             , min: offer.quantity_min, max: offer.quantity_max, step: 1 } })
    ) : ''

  , formGroup('Attach note:'
    , input('.form-control.form-control-lg', { attrs: { type: 'text', name: 'payer_note', placeholder: '(optional)' } })
    , 'A note to send to the payee along with the payment.')

  , div('.form-buttons', [
      !offer.currency ? div('.mb-3', 'Do you confirm making this payment?') : ''
    , div([
        button('.btn.btn-lg.btn-primary.mb-1', { attrs: { type: 'submit' } }
        , offer.msatoshi ? `Pay ${unitf(mul(offer.msatoshi, offerPayQuantity))}`
        : offer.currency ? 'Continue'
                         : 'Send Payment')
      , ' '
      , a('.btn.btn-lg.btn-secondary.mb-1', { attrs: { href: '#/' } }, 'Cancel')
      ])
    ])

  , expert ? yaml(offer) : ''
  ])

// Display a remote offer for us to receive a payment (send_invoice=true)
// Receive offers with no fixed amounts are currently unsupported (rejected by the server side).
const offerRecv = offer => ({ unitf, conf: { expert} }) =>
  form('.offer-recv', { attrs: { do: 'offer-recv' }, dataset: offer }, [
    h2('Receive payment')

  , p([ 'You were offered a payment of ', strong('.toggle-unit', unitf(offer.msatoshi)), '. Do you accept it?' ])

  //, expert ? p([ 'Node ID: ', small('.text-muted.break-all', offer.node_id) ]) : ''
  //, expert ? p([ 'Offer ID: ', small('.text-muted.break-all', offer.offer_id) ]) : ''

  , offer.vendor ? p([ 'Vendor: ', span('.text-muted.break-word', offer.vendor) ]) : ''

  , showDesc(offer) ? p([ 'Description: ', span('.text-muted.break-word', offer.description) ]) : ''

  , div('.form-buttons', [
      button('.btn.btn-lg.btn-primary', { attrs: { type: 'submit' } }
      , `Receive ${unitf(offer.msatoshi)}`)
    , ' '
    , a('.btn.btn-lg.btn-secondary', { attrs: { href: '#/' } }, 'Cancel')
    ])

  , expert ? yaml(offer) : ''
  ])


// Display a remote offer
export const offer = offer =>
  (offer.send_invoice ? offerRecv : offerPay)(offer)

// Display a local offer
// Currently supports receive offers only (send_invoice=false) and doesn't support quantity/recurrence
export const localOffer = offer => qrinv(offer).then(qr => ({ unitf, conf: { expert } }) =>
  div('.local-offer-recv', [
    div('.row', [
      div('.col-sm-6.text-center', [
        h2('Receive payment(s)')
      , p(`You can receive multiple payments${offer.msatoshi != 'any'?` of ${unitf(offer.msatoshi)} each`:''} using the reusable BOLT12 offer:`)
      , small('.d-none.d-sm-block.text-muted.break-all.mt-3', offer.bolt12_unsigned)
      ])
    , div('.col-sm-6.text-center', [
        img('.qr', { attrs: { src: qr } })
      , small('.d-block.d-sm-none.text-muted.break-all.mt-3', offer.bolt12_unsigned)
      ])
    ])
  , expert ? yaml(omitKey('bolt12', offer)) : ''
  ]))

const mul = (msatoshi, quantity=1) =>
  quantity == 1 ? msatoshi : Big(msatoshi).mul(quantity).toFixed(0)
