import { Resend } from 'resend'
import { render } from '@react-email/render'
import type { ReactElement } from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Trilheiros <noreply@trilheiros.app>'

export async function sendEmail({
  to,
  subject,
  template,
}: {
  to: string | string[]
  subject: string
  template: ReactElement
}) {
  const html = await render(template)

  const { error } = await resend.emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
