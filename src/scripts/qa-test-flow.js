const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runQA() {
  console.log("🚀 [QA] Starting MongoMemoryServer...");
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(`[QA] MongoMemoryServer running at: ${uri}`);

  // Create a temporary .env.local file
  const envPath = path.join(process.cwd(), '.env.local.test');
  fs.writeFileSync(envPath, `MONGODB_URI=${uri}\nNEXT_PUBLIC_APP_URL=http://localhost:3000\nJWT_SECRET=test-secret`);

  console.log("🚀 [QA] Starting Next.js Dev Server...");
  const nextDev = spawn('npx', ['next', 'dev'], {
    env: { ...process.env, MONGODB_URI: uri, NODE_ENV: 'development' },
    stdio: 'pipe'
  });

  let serverReady = false;

  nextDev.stdout.on('data', async (data) => {
    const output = data.toString();
    process.stdout.write(`[Next.js] ${output}`);
    
    if (output.includes('Ready in') || output.includes('started server on')) {
      if (!serverReady) {
        serverReady = true;
        console.log("✅ [QA] Server is ready. Running tests...");
        await executeTests(uri);
        nextDev.kill();
        await mongod.stop();
        if (fs.existsSync(envPath)) fs.unlinkSync(envPath);
        process.exit(0);
      }
    }
  });

  nextDev.stderr.on('data', (data) => {
    process.stderr.write(`[Next.js ERR] ${data}`);
  });
}

async function executeTests(uri) {
  try {
    // 1. Hit a custom seed API or just run the seed logic directly here?
    // Wait, the seed logic uses TS. Let's just run tsx to seed the DB first.
    console.log("🌱 [QA] Seeding database...");
    await new Promise((resolve, reject) => {
      const seed = spawn('npx', ['tsx', 'src/scripts/seed-db.ts'], {
        env: { ...process.env, MONGODB_URI: uri }
      });
      seed.stdout.pipe(process.stdout);
      seed.stderr.pipe(process.stderr);
      seed.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Seed failed'));
      });
    });

    console.log("📝 [QA] Simulating Anonymous Assessment Submission...");
    const submitRes = await fetch("http://localhost:3000/api/mental-battery/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phq9: Array(9).fill(1),
        gad7: Array(7).fill(1),
        dass21: Array(21).fill(1),
      })
    });
    
    if (!submitRes.ok) {
      throw new Error(`Submit API failed: ${await submitRes.text()}`);
    }
    
    const submitData = await submitRes.json();
    console.log("✅ [QA] Submit Success! Data:", submitData);

    const { id, publicToken, archetypeId } = submitData;

    console.log("📝 [QA] Simulating Lead Form Submission (Claim)...");
    const claimRes = await fetch("http://localhost:3000/api/mental-battery/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultId: id,
        publicToken,
        name: "QA Tester",
        email: "qa@lmhy.id",
        whatsapp: "08123456789",
        source: "qa_test"
      })
    });

    if (!claimRes.ok) {
      throw new Error(`Claim API failed: ${await claimRes.text()}`);
    }

    const claimData = await claimRes.json();
    console.log("✅ [QA] Claim Success! Lead ID:", claimData.leadId);

    console.log("📝 [QA] Simulating Result Page View...");
    const resultRes = await fetch(`http://localhost:3000/api/mental-battery/results/${id}?token=${publicToken}`);
    if (!resultRes.ok) {
      throw new Error(`Result View failed: ${await resultRes.text()}`);
    }
    const resultData = await resultRes.json();
    console.log("✅ [QA] Result Data fetched successfully. Battery:", resultData.batteryPercentage);

    console.log("🎉 [QA] All tests passed perfectly!");
  } catch (err) {
    console.error("❌ [QA] Test failed:", err);
  }
}

runQA();
