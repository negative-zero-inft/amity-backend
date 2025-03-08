import * as React from 'react'
import { Tailwind, Section, Text, Row, Column, Img, Link, Button, Heading } from '@react-email/components'

const baseURL = process.env.NODE_ENV === "production" ? process.env.CDN_URL : "";

export default function OTPEmail({ otp }: { otp: number }) {
    return (
        <Tailwind>
            <Section className="min-w-screen font-sans flex flex-gap">
                <Section>
                    <Text className="text-lg">Hey! Thank you for joining Amity! Before we continue setting up your account, please confirm your email. This button will be valid for 10 minutes.</Text>
                </Section>
                <div className="flex items-center justify-center h-[30px]">
                    <Button
                        className="box-border w-[230px] rounded-[10px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white"
                        href="https://react.email"
                    >
                        Verify your email
                    </Button>
                </div>
                <Section className="px-[32px] py-[40px]">
                    <Row>
                        <Column className="w-[80%]">
                            <Img
                                alt="Amity logo"
                                height="42"
                                src={`${baseURL}/static/amy.png`}
                            />
                        </Column>
                        <Column align="right">
                            <Row align="right">
                                <Column>
                                    <Link href="https://x.com/OfficialNegZero">
                                        <Img
                                            alt="X"
                                            className="mx-[4px]"
                                            height="36"
                                            src="https://react.email/static/x-logo.png"
                                            width="36"
                                        />
                                    </Link>
                                </Column>
                            </Row>
                        </Column>
                    </Row>
                </Section>
            </Section>
        </Tailwind>
    )
}

OTPEmail.PreviewProps = {
    otp: 123456,
}