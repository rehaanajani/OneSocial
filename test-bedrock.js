require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const MODEL = process.env.BEDROCK_CAPTION_MODEL || 'anthropic.claude-3-5-haiku-20241022-v1:0';

console.log('🔍 Testing Bedrock Connection...');
console.log('   Region :', process.env.AWS_REGION);
console.log('   Key ID :', process.env.AWS_ACCESS_KEY_ID?.slice(0, 8) + '...');
console.log('   Model  :', MODEL);
console.log('');

async function test() {
    try {
        const body = JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 50,
            messages: [{ role: 'user', content: [{ type: 'text', text: 'Say hello in 5 words.' }] }],
        });

        const cmd = new InvokeModelCommand({
            modelId: MODEL,
            contentType: 'application/json',
            accept: 'application/json',
            body,
        });

        const resp = await client.send(cmd);
        const result = JSON.parse(Buffer.from(resp.body).toString('utf-8'));
        console.log('✅ SUCCESS! Model responded:', result.content[0].text);
    } catch (err) {
        console.error('❌ FULL ERROR:');
        console.error('   Name   :', err.name);
        console.error('   Code   :', err.$metadata?.httpStatusCode);
        console.error('   Message:', err.message);
        if (err.Code) console.error('   Code   :', err.Code);
        console.error('\n   Full:', JSON.stringify(err, null, 2));
    }
}

test();
