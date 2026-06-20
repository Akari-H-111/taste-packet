import { TasteEncoder } from '../xtaste-client-sdk/dist/core/encoder.js';

// Simulate a Sparse Fieldsets response from Twitter API v2
function generateMockTwitterTimeline(count) {
    const timeline = [];
    for (let i = 0; i < count; i++) {
        timeline.push({
            id: `182938475${String(i).padStart(3, '0')}`,
            text: "This is a simulated tweet to test the X-Taste compression ratio. It includes various metadata fields common in Twitter API v2 responses. #testing #performance",
            public_metrics: {
                retweet_count: (i * 37) % 1000,
                reply_count: (i * 19) % 500,
                like_count: (i * 113) % 5000,
                quote_count: (i * 11) % 100,
                bookmark_count: (i * 17) % 200,
                impression_count: (i * 997) % 50000
            },
            attachments: {
                media_keys: ["3_1629384756"]
            },
            context_annotations: [
                { domain: { id: "123", name: "Tech" }, entity: { id: "456", name: "Optimization" } }
            ]
        });
    }
    return timeline;
}

const TWEET_COUNT = 100;
const twitterJson = generateMockTwitterTimeline(TWEET_COUNT);

// Calculate the original JSON payload size
const jsonString = JSON.stringify(twitterJson);
const originalSizeBytes = Buffer.byteLength(jsonString, 'utf8');

console.log(`=================================================`);
console.log(`🚀 Phase A: X-Taste Cross-Platform Drop-In Capability (Twitter v2 Mock)`);
console.log(`=================================================`);
console.log(`[Baseline] 100 Twitter v2 JSON payload size: ${(originalSizeBytes / 1024).toFixed(2)} KB (${originalSizeBytes} Bytes)`);

// Simulate Adapter Middleware: Map Twitter format to .taste RawPostData
console.log(`\n[Adapter] Initiating Data Dehydration...`);
const tasteBuffer = new Uint8Array(TWEET_COUNT * 16); // 100 posts strictly = 1600 bytes

const startTime = performance.now();

for (let i = 0; i < TWEET_COUNT; i++) {
    const tweet = twitterJson[i];
    const engagement = tweet.public_metrics.like_count + tweet.public_metrics.retweet_count + tweet.public_metrics.reply_count;
    
    // Drop-in Mapping Logic
    const rawPostData = {
        postId: tweet.id,
        text: tweet.text,
        mediaCount: tweet.attachments && tweet.attachments.media_keys ? tweet.attachments.media_keys.length : 0,
        mediaType: 1, // 1 = Image
        engagement: engagement,
        emotionScore: 0.8, // Simulated emotion score
        socialState: {
            liked: tweet.public_metrics.like_count > 2500, // Randomly simulate user state
            reposted: false,
            commented: false,
            bookmarked: false,
            closeFriend: false,
            following: true,
            muted: false,
            blocked: false
        },
        layout: 1 // 1 = Top Image Layout
    };

    const matrix = TasteEncoder.encode(rawPostData);
    tasteBuffer.set(matrix.buf, i * 16);
}

const endTime = performance.now();
const newSizeBytes = tasteBuffer.byteLength;
const compressionRatio = ((1 - (newSizeBytes / originalSizeBytes)) * 100).toFixed(2);

console.log(` -> Dehydration Complete! Time elapsed: ${(endTime - startTime).toFixed(3)} ms (Pure synchronous bitwise operations)`);
console.log(`[X-Taste] 100 .taste packets total size: ${(newSizeBytes / 1024).toFixed(2)} KB (${newSizeBytes} Bytes)`);
console.log(`-------------------------------------------------`);
console.log(`📉 Bandwidth Savings: ${compressionRatio}% (0 dependencies, 0 WebAssembly)`);
console.log(`=================================================`);
