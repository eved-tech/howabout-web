import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — How about",
};

const LAST_UPDATED = "10 November 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl w-full px-6 py-12">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700 underline">
        ← Back to How about
      </Link>

      <h1 className="mt-6 text-3xl font-semibold text-neutral-900">Terms of Use</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-neutral-700">
        <p>
          Welcome to How about (<strong>howabout.co.za</strong>). These Terms of Use (&quot;Terms&quot;) govern your
          access to and use of the How about website and service (the &quot;Service&quot;), operated by{" "}
          <strong>Agentic Health (Pty) Ltd</strong> (&quot;How about&quot;, &quot;we&quot;, &quot;us&quot;). By
          creating an account or otherwise using the Service, you agree to these Terms. If you don&apos;t agree to
          them, please don&apos;t use the Service.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">1. What How about is</h2>
          <p className="mt-2">
            How about is a platform where people in South Africa can submit ideas for how brands and businesses
            could do better, let others vote (&quot;cheer&quot;) on those ideas, and give brands a place to respond.
            It is not a complaints hotline, a customer service channel, or a way to contact a brand directly about an
            individual problem — brands aren&apos;t obliged to see, respond to, or act on anything posted here, and we
            don&apos;t guarantee that they will.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">2. Who can use How about</h2>
          <p className="mt-2">
            You must be at least 18 years old and able to form a binding contract to create an account. By using the
            Service, you confirm that this is true and that the information you give us (including at sign-up) is
            accurate and kept up to date. You&apos;re responsible for keeping your account credentials secure and for
            anything that happens under your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">3. Submitting and voting on ideas</h2>
          <p className="mt-2">When you submit an idea or cheer for one, a few basic rules apply:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1.5">
            <li>An idea should be a genuine suggestion for how a brand could improve — not a personal dispute,
              a threat, harassment, or a disguised complaint aimed at a specific individual.</li>
            <li>Don&apos;t post anything false, defamatory, abusive, hateful, obscene, or illegal, or anything that
              infringes someone else&apos;s rights (including privacy and intellectual property rights).</li>
            <li>Don&apos;t post anyone else&apos;s personal information without their permission.</li>
            <li>One account, one vote per idea. Don&apos;t use bots, multiple accounts, or any other method to
              inflate or manipulate votes.</li>
            <li>Don&apos;t impersonate a brand, a brand representative, or any other person.</li>
          </ul>
          <p className="mt-2">
            We may flag, hide, remove, or restrict any idea, comment, vote, or account that breaks these rules or
            that we reasonably believe could expose us or others to harm or liability — including through the
            moderation and reporting tools built into the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">4. Your content</h2>
          <p className="mt-2">
            You keep ownership of the ideas, comments, and other content you submit (&quot;Your Content&quot;). By
            posting it, you give How about a non-exclusive, worldwide, royalty-free licence to host, display,
            reproduce, and distribute Your Content on and in connection with the Service (for example, showing it on
            a brand&apos;s page or in promotional material about How about), for as long as it remains on the
            Service. You confirm that you have the right to post Your Content and to grant us this licence.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">5. Brand accounts and responses</h2>
          <p className="mt-2">
            Brands can claim their profile on How about and respond to ideas addressed to them. A brand is
            responsible for anything posted from its account, including the accuracy of its responses. We take
            reasonable steps to confirm that a brand account is operated by someone authorised to act for that
            brand, but we don&apos;t guarantee this, and we aren&apos;t responsible for the content of a brand&apos;s
            response.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">6. Prizes and competitions</h2>
          <p className="mt-2">
            From time to time we may run competitions or offer prizes for ideas. Where we do, additional terms
            specific to that competition will apply and will be made available at the time — nothing on the Service
            is an offer or guarantee of a prize unless those specific terms say so.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">7. Intellectual property</h2>
          <p className="mt-2">
            Other than Your Content, everything on the Service — including the How about name, logo, design, and
            underlying software — belongs to How about or its licensors and is protected by copyright, trade mark,
            and other laws. You may not copy, scrape, modify, or create derivative works from the Service except as
            needed for your own normal personal use of it.
          </p>
          <p className="mt-2">
            Brand names and logos shown on the Service belong to their respective owners. Their appearance on How
            about doesn&apos;t imply that the brand endorses, sponsors, or is affiliated with How about unless we
            say otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">8. No warranty</h2>
          <p className="mt-2">
            The Service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind.
            We don&apos;t guarantee that the Service will be uninterrupted, error-free, or secure, or that any idea
            will be seen, considered, or acted on by any brand.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">9. Limitation of liability</h2>
          <p className="mt-2">
            To the fullest extent permitted by law, How about won&apos;t be liable for any indirect, incidental, or
            consequential loss arising from your use of the Service, or for content posted by other users or brands.
            Nothing in these Terms limits any liability that can&apos;t be limited under South African law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">10. Suspension and termination</h2>
          <p className="mt-2">
            We may suspend or terminate your account, or remove Your Content, at any time if we reasonably believe
            you&apos;ve broken these Terms or used the Service in a way that could harm How about, other users, or
            brands. You can stop using the Service, or ask us to delete your account, at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">11. Privacy</h2>
          <p className="mt-2">
            Our Privacy Policy explains how we collect, use, and protect your personal information, in line with
            South Africa&apos;s Protection of Personal Information Act (POPIA). By using the Service, you also agree
            to that Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">12. Changes to these Terms</h2>
          <p className="mt-2">
            We may update these Terms from time to time — for example, as the Service grows or the law changes.
            We&apos;ll update the &quot;Last updated&quot; date above when we do. If you keep using the Service after
            a change, that means you accept the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">13. Governing law</h2>
          <p className="mt-2">
            These Terms are governed by the laws of the Republic of South Africa, and any dispute will be subject to
            the jurisdiction of the South African courts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">14. Contact us</h2>
          <p className="mt-2">
            Questions about these Terms? Reach us at <strong>hello@howabout.co.za</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}
