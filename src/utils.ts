function randomID() {
    const chars = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890";
    let result = "";
    for (let i = 0; i < 24; i++) {
        result += chars[Math.round(Math.random() * 100 % 35)];
    }
    return result;
}

function randomChars(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export { randomID, randomChars };