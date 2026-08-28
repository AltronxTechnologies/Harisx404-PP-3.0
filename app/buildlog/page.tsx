import { MDXContent } from "@/app/components/mdx-content";
import { NewsletterSignUp } from "@/app/components/NewsletterSignUp";
import { fetchAndSortChangelogPosts } from "@/app/lib/utils";
import { GridWrapper } from "@/app/components/GridWrapper";
import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Buildlog | Muhammad Haris",
  description:
    "A running log of new features, fixes, and experiments shipped on Muhammad Haris's portfolio site.",
};

export default async function ChangelogPage() {
  const allChangelogItems = await fetchAndSortChangelogPosts();

  return (
    <div className="w-full space-y-16">
      <div className="mx-auto text-balance pt-14 text-center md:pt-16">
        <GridWrapper>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-text-tertiary">
            BUILDLOG
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-[1.05] text-text-primary md:text-5xl">
            What&apos;s{" "}
            <em className="text-gradient-accent italic">new &amp; exciting</em>{" "}
            on this site
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            A running log of features, fixes, and experiments as the site
            evolves.
          </p>
        </GridWrapper>
      </div>

      <ul className="flex flex-col">
        {allChangelogItems.length > 0 ? (
          <>
            {allChangelogItems.map((post) => {
              return (
                <li key={post.slug}>
                  <div
                    key={post.slug}
                    className="grid h-full grid-cols-1 rounded-2xl md:grid-cols-12"
                  >
                    <div className="col-span-2 col-start-1 hidden space-y-2 p-4 md:block">
                      <div className="font-mono text-sm leading-none text-text-secondary">
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </time>
                      </div>
                    </div>
                    <div className="col-start-3 col-end-4 hidden h-full border-x border-dashed border-border-primary md:block"></div>
                    <div className="flex w-full flex-grow flex-col p-4 md:col-span-9 md:col-start-4">
                      <div className="mb-3 font-mono text-sm leading-none text-text-secondary md:hidden">
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </time>
                      </div>
                      <h2 className="mb-8 text-balance text-2xl font-medium leading-none tracking-tight text-text-primary">
                        {post.title}
                      </h2>
                      {post.imageName ? (
                        <Image
                          className="drama-shadow mb-12 aspect-video rounded-xl object-cover"
                          src={`/${post.imageName}`}
                          alt={post.title}
                          width={800}
                          height={450}
                        />
                      ) : null}
                      {post.code === "Mock content" ? (
                        <p className="text-text-secondary">{post.code}</p>
                      ) : (
                        <MDXContent code={post.code} />
                      )}
                    </div>
                  </div>
                  <div className="h-0 w-full border-t border-dashed border-border-primary" />
                </li>
              );
            })}
          </>
        ) : (
          <p>Nothing to see here yet...</p>
        )}
      </ul>

      <NewsletterSignUp />
    </div>
  );
}
