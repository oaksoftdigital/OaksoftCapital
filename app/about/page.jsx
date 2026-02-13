export default function About() {
  return (
    <div className="w-full bg-transparent">
      <div
        className="flex justify-center pt-[60px] mb-[60px]"
        style={{
          width: "292.07px",
          height: "76.8px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <h1
          className="text-white text-center align-middle uppercase"
          style={{
            fontFamily: "var(--font-abhaya-libre), serif",
            fontWeight: 800,
            fontSize: "48px",
            lineHeight: "76.8px",
            letterSpacing: "11px",
          }}
        >
          ABOUT
        </h1>
      </div>

      <div className="w-full flex flex-col">
        <div className="w-full py-8" style={{ background: "transparent", paddingTop: "70px" }}>
          <div className="max-w-[800px] mx-auto px-[30px] md:px-[100px] lg:px-0">
            <p
              className="text-white text-center"
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                fontWeight: 400,
                marginBottom: "0",
              }}
            >
              Crypto is revolutionizing technology, markets, and business models by enabling programmable blockchains to become the backbone of financial systems, government and data integrity. Every asset class will eventually be digitized, and crypto is the game-changer driving this transformation. 
            </p>
            <p
              className="text-white text-center"
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                fontWeight: 400,
                marginBottom: "0",
              }}
            >
              Navigating this evolving space requires a multidisciplinary approach, blending expertise in cryptography, game theory, network and behavioral economics, competitive strategy, computer science, early-stage investing, and portfolio management. 
            </p>
          </div>
        </div>

        <div className="w-full py-8" style={{ background: "transparent" }}>
          <div className="max-w-[800px] mx-auto px-[30px] md:px-[100px] lg:px-0">
            <p
              className="text-white text-center"
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                fontWeight: 400,
                marginBottom: "0",
              }}
            >
              We are a diverse team of venture investors, traders, software engineers, data scientists, operators, and risk managers committed to building this globally connected industry.             We consider it essential to assist in managing and securing digital assets, using quantitative frameworks to optimize portfolio performance, while mitigating risks like volatility and asset security.
            </p>
                        <p
              className="text-white text-center"
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                fontWeight: 400,
                marginBottom: "0",
              }}
            >
              Our VC arm partners with the pioneering teams and projects driving this paradigm shift—from their earliest stages through the liquid market journey. We think on a 20 year horizon, focusing our investments on infrastructure start-ups powering the next wave of decentralization. We take an active role as both investors and users, providing strategic support to nascent, low-cap projects that need resources to thrive. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}