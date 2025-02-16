function randomID() {
    const chars = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890";
    let result = "";
    for (let i = 0; i < 24; i++) {
        result += chars[Math.round(Math.random() * 100 % 35)];
    }
    return result;
}

export {randomID};