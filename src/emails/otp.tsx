import * as React from 'react'
import { Tailwind, Section, Text, Row, Column, Img, Link } from '@react-email/components'

const baseURL = process.env.NODE_ENV === "production" ? process.env.CDN_URL : "";

export default function OTPEmail({ otp }: { otp: number }) {
    return (
        <Tailwind>
            <Section className="flex justify-center items-center w-screen min-h-screen font-sans">
                <Section className="flex flex-col items-center w-76 rounded-2xl px-6 py-1 bg-gray-50">
                    <Text className="text-xs font-medium text-violet-500">
                        Verify your Email Address
                    </Text>
                    <Text className="text-gray-500 my-0">
                        Use the following code to verify your email address
                    </Text>
                    <Text className="text-5xl font-bold pt-2">{otp}</Text>
                    <Text className="text-gray-400 font-light text-xs pb-4">
                        This code is valid for 10 minutes.
                    </Text>
                    <Text className="text-gray-600 text-xs">
                        Thank you joining us
                    </Text>
                </Section>
                <Section className="my-[40px] px-[32px] py-[40px]">
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
                                <Column className="px-[8px]">
                                    <Link className="text-gray-600 [text-decoration:none]" href="#">

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
    otp: 123456
}