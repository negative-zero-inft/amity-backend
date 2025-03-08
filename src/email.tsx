import { Elysia, t } from 'elysia'

import OTPEmail from './emails/otp'

import { Resend } from 'resend'
import React from 'react'
import ReactDOMServer from 'react-dom/server';

const resend = new Resend(Bun.env.RESEND_API)

new Elysia()
	.get('/otp', async ({ body }) => {
		// Random between 100,000 and 999,999
		const otp = ~~(Math.random() * (900_000 - 1)) + 100_000

		await resend.emails.send({
			from: 'Dobby <dobby@example.com>',
			to: body,
			subject: 'Verify your email address',
			html: ReactDOMServer.renderToString(<OTPEmail otp={otp} />),
		})

		return { success: true }
	}, {
		body: t.String({ format: "email" })
	})