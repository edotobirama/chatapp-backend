import bcrypt from 'bcrypt';

export async function generateHashFromArray(stringArray: string[], saltRounds: number = 10): Promise<string> {
    // Step 1: Concatenate all strings in the array
    const concatenatedString = stringArray.join('');

    // Step 2: Generate a salt
    const salt = await bcrypt.genSalt(saltRounds);

    // Step 3: Hash the concatenated string using bcrypt
    const hash = await bcrypt.hash(concatenatedString, salt);

    return hash;
}