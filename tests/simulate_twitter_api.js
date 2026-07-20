import { TasteEncoder } from '../xtaste-client-sdk/dist/core/encoder.js';

// Simulate a representative social timeline API response.
function generateMockTwitterTimeline(count) {
    const timeline = [];
    for (let i = 0; i < count; i++) {
        timeline.push({
            id: `182938475${String(i).padStart(3, '0')}`,
            text: "This is a simulated post used to measure the Project .taste payload ratio. It includes metadata fields common in social timeline API responses. #testing #performance",
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
console.log(`Project .taste benchmark (representative timeline mock)`);
console.log(`=================================================`);
console.log(`[Baseline] 100 JSON posts: ${(originalSizeBytes / 1024).toFixed(2)} KB (${originalSizeBytes} bytes)`);

// Simulate Adapter Middleware: Map Twitter format to .taste RawPostData
console.log(`\n[Encoder] Encoding 100 semantic previews...`);
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

console.log(`[Encoder] Completed in ${(endTime - startTime).toFixed(3)} ms`);
console.log(`[Project .taste] 100 packets: ${(newSizeBytes / 1024).toFixed(2)} KB (${newSizeBytes} bytes)`);
console.log(`-------------------------------------------------`);
console.log(`[Result] ${compressionRatio}% fewer bytes (0 runtime dependencies)`);
console.log(`=================================================`);
