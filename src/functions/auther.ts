import { User } from "../schemas/user";
import { env } from "bun";

export const auther = (magicNumber: number) => {

    const currentTime = new Date()
    // Round the current time to the nearest 2 minutes
    const roundedTime = new Date(Math.round(currentTime.getTime() / (2 * 60 * 1000)) * (2 * 60 * 1000));

    // Create a string from the prime and rounded time
    const inputString = `${magicNumber}-${roundedTime}`;

    // Use a simple hash function to generate a hash
    let hash = 0;
    for (let i = 0; i < inputString.length; i++) {
        const char = inputString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    // Convert the hash to a base36 string and pad to ensure it's 8 characters
    const base36Hash = Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);

    return base36Hash;
}

export const checkTotp = async (totp: string, homeserver: string, uid: string, set: any) =>{
    if(homeserver != env.SERVER_URL){
        const res = await fetch(`${homeserver}:3000/auth?totp=${totp}&uid=${uid}`)
        if(res.status != 200){
            return {
                isError: true,
                msg: await res.text()
            }
        }else{
            return {
                isError: false,
                msg: "authed"
            }
        }
    }
    const user = await User.findOne({"id.id": uid})
    if(!user){
        set.status = 401
        return {
            isError: true,
            msg: "user not found"
        }
    }
    if(totp != auther(user.authNumber as number)){
        set.status = 401
        return {
            isError: true,
            msg: "incorrect totp"
        }
    }
    return {
        isError: false,
        msg: "authed"
    }
}

export const isPrime = (num: number) => {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
}

export const generateRandom32DigitNumber = () => {
    let number = '1'; // Start with 1 to ensure it's 32 digits
    for (let i = 0; i < 9; i++) {
        number += Math.floor(Math.random() * 10).toString();
    }
    return Number(number);
}

export const findRandom32DigitPrime = () => {
    let primeCandidate = generateRandom32DigitNumber();
    while (!isPrime(primeCandidate)) {
        primeCandidate = generateRandom32DigitNumber();
    }
    return primeCandidate;
}