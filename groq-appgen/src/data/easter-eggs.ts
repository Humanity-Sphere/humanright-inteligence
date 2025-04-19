interface EasterEgg {
  trigger: string;
  prompt: string;
}

export const EASTER_EGGS: EasterEgg[] = [
  {
    trigger: "groq race",
    prompt: `A race where 3 logos go from left to right. Each logo is on a separate row, but it's a snug fit. Make sure the logos are not overlapping and the page width is used.
				
The logos should have rounded corners. Make them 48px. The text should appear once the Groq logo is at the finish line. 

Only the Groq logo should STOP before the finish line, then we stop updating the position of the other logos.

Use pure JavaScript for the animation.

As a funny joke, put the logos of Cerebras and SambaNova upside down using CSS transforms.

Groq (https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_2/le3jn0kzou7feco18wuo) goes to the finish fastest
SambaNova (https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_2/y85yyhlbrxjtcow3u9es)
Cerebras (https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_2/oxlye0pmonwkanrw206j)
NVIDIA (https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_2/v1502744943/jhowtgkdwv2aa1eodg2b.png)
AMD (https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_2/mexfxtohyewwqg7iq2wl)
Intel (https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_2/qpoiezeptj4q8krro55g)

Make sure it is correct JavaScript, you are an expert coder.

Make sure Groq, SambaNova, Cerabras, NVIDIA, AMD, Intel are all represented. Speeds between 0.2 and 1.0.

Then the text appears: Groq wins!`,
  },
  {
    trigger: "work4groq",
    prompt: `Create a fun, fake job board for Groq with the following elements:

1. A bold header saying "Join the Groq Revolution!"
2. A list of 4-5 ridiculous AI-related job titles in a list (no description). Be creative and humorous!
3. Each job listing should have a fake "Apply Now" button that, when clicked, reveals a silly message.
4. At the bottom of the page, add a small, conspicuous link saying "Psst... Want to join for real? Click here!" that directs to https://job-boards.greenhouse.io/embed/job_board?for=groq`,
  },
  {
    trigger: "higher rate limits",
    prompt: `Create a fun email composition interface with the following elements:

1. A pre-filled "To:" field that says "mgurton@groq.com"
2. A pre-filled "Subject:" field that says "Rate Limit Increase Request"
3. A pre-filled message body that says "Please Mr. Gurton, can I get some higher rate limits plz? 🙏"
4. A large "Send" button at the bottom (it doesn't need to actually send)

Style it to look like a modern email interface with good spacing and a clean design.
When the send button is clicked, show a fun animation or message.

Add some playful elements like emoji reactions or a fun background pattern.`,
  },
];
