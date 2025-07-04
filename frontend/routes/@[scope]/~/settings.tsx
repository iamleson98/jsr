// Copyright 2024 the JSR authors. All rights reserved. MIT license.
import { HttpError } from "fresh";
import { ComponentChildren } from "preact";
import { TbCheck, TbTrash } from "tb-icons";
import { define } from "../../../util.ts";
import { ScopeHeader } from "../(_components)/ScopeHeader.tsx";
import { ScopeNav } from "../(_components)/ScopeNav.tsx";
import { ScopeDescriptionForm } from "../(_islands)/ScopeDescriptionForm.tsx";
import { FullScope, User } from "../../../utils/api_types.ts";
import { scopeDataWithMember } from "../../../utils/data.ts";
import { path } from "../../../utils/api.ts";
import { QuotaCard } from "../../../components/QuotaCard.tsx";
import { scopeIAM } from "../../../utils/iam.ts";
import { TicketModal } from "../../../islands/TicketModal.tsx";

export default define.page<typeof handler>(function ScopeSettingsPage(
  { data, state },
) {
  return (
    <div class="mb-20">
      <ScopeHeader scope={data.scope} />
      <ScopeNav active="Settings" iam={data.iam} scope={data.scope.scope} />
      <ScopeDescription scope={data.scope} />
      <ScopeQuotas scope={data.scope} user={state.user!} />
      <GitHubActionsSecurity scope={data.scope} />
      <RequirePublishingFromCI scope={data.scope} />
      <DeleteScope scope={data.scope} />
    </div>
  );
});

function ScopeDescription({ scope }: { scope: FullScope }) {
  return (
    <div class="mb-8">
      <h2 class="text-lg sm:text-xl font-semibold">Description</h2>
      <p>
        The description of the scope{" "}
        <code class="font-mono">@{scope.scope}</code>:
      </p>
      <ScopeDescriptionForm scope={scope} />
    </div>
  );
}

function ScopeQuotas({ scope, user }: { scope: FullScope; user: User }) {
  return (
    <div class="mt-8">
      <h2 class="text-lg sm:text-xl font-semibold">Quotas</h2>
      <div class="flex flex-col gap-8">
        <p class="text-secondary max-w-2xl">
          Scopes have certain quotas to help prevent abuse. We are happy to
          increase your quotas as needed — just send us an increase request.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuotaCard
            title="Total packages"
            description="The total number of packages in the scope."
            limit={scope.quotas.packageLimit}
            usage={scope.quotas.packageUsage}
          />
          <QuotaCard
            title="New packages per week"
            description="The number of new packages that can be created in the scope over a 7 day rolling window."
            limit={scope.quotas.newPackagePerWeekLimit}
            usage={scope.quotas.newPackagePerWeekUsage}
          />
          <QuotaCard
            title="Publish attempts per week"
            description="The number of versions that can be published across all packages in the scope over a 7 day rolling window."
            limit={scope.quotas.publishAttemptsPerWeekLimit}
            usage={scope.quotas.publishAttemptsPerWeekUsage}
          />
        </div>
        <div>
          <TicketModal
            user={user}
            kind="scope_quota_increase"
            style="primary"
            title="Request scope quota increase"
            description={
              <>
                <p class="mt-4 text-secondary">
                  Please provide a reason for requesting a quota increase for
                  the scope @{scope.scope}. Your limit does not have to be
                  exhausted already to request an increase.
                </p>
              </>
            }
            fields={[
              {
                name: "quota kind",
                label: "Quota to increase",
                type: "select",
                values: [
                  "Total packages",
                  "New packages per week",
                  "Publish attempts per week",
                ],
                required: true,
              },
              {
                name: "amount",
                label: "Amount to increase by",
                type: "number",
                required: true,
              },
              {
                name: "message",
                label: "Reason",
                type: "textarea",
                required: true,
              },
            ]}
            extraMeta={{ scope: scope.scope }}
          >
            Request scope quota increase
          </TicketModal>
        </div>
      </div>
    </div>
  );
}

function GitHubActionsSecurity({ scope }: { scope: FullScope }) {
  return (
    <div class="mb-12 mt-12">
      <h2 class="text-lg sm:text-xl font-semibold">GitHub Actions security</h2>
      <p class="mt-2 text-secondary max-w-2xl">
        GitHub Actions can be used to publish packages to JSR without having to
        set up authentication tokens. Publishing is permitted only if the
        workflow runs in the GitHub repository that is linked to the package on
        JSR.
      </p>
      <p class="mt-4 text-secondary max-w-2xl">
        Additionally, you can restrict publishing to be permitted only if the
        user that triggered the GitHub Actions workflow is a member of this
        scope on JSR.{" "}
      </p>
      <form
        class="mt-8 grid gap-4 md:grid-cols-2 w-full max-w-4xl"
        method="POST"
      >
        <CardButton
          title="Restrict publishing to members"
          description={
            <>
              The GitHub user that triggers the GitHub Actions workflow must be
              a member of this JSR scope, and the workflow must run in the
              GitHub repository linked to the JSR package.
            </>
          }
          selected={scope.ghActionsVerifyActor}
          type="submit"
          name="action"
          value="enableGhActionsVerifyActor"
        />
        <CardButton
          title="Do not restrict publishing"
          description={
            <>
              Any GitHub user with write access to the GitHub repository can
              trigger a GitHub Actions workflow to publish a new version. The
              workflow must run in the GitHub repository linked to the JSR
              package.
            </>
          }
          selected={!scope.ghActionsVerifyActor}
          type="submit"
          name="action"
          value="disableGhActionsVerifyActor"
        />
      </form>
    </div>
  );
}

function RequirePublishingFromCI({ scope }: { scope: FullScope }) {
  return (
    <div class="mb-12 mt-12">
      <h2 class="text-lg sm:text-xl font-semibold">
        Require Publishing from CI
      </h2>
      <p class="mt-2 text-secondary max-w-2xl">
        Requiring publishing from CI ensures that all new versions for packages
        in this scope are published from a GitHub Actions workflow. This
        disables the ability to publish with the{" "}
        <span class="font-mono">jsr publish</span>{" "}
        command from a local development environment.
      </p>

      <p class="mt-4 text-secondary max-w-2xl">
        This setting is currently{" "}
        <span class="font-semibold">
          {scope.requirePublishingFromCI ? "enabled" : "disabled"}
        </span>. {scope.requirePublishingFromCI
          ? (
            "All new versions for packages in this scope are required to be published from a GitHub Actions workflow."
          )
          : (
            "New versions can be published from CI, or from a local development environment."
          )}
      </p>
      <form
        class="mt-8 max-w-4xl"
        method="POST"
      >
        <input
          type="hidden"
          name="value"
          value={String(!scope.requirePublishingFromCI)}
        />
        <button
          name="action"
          value="requirePublishingFromCI"
          class={scope.requirePublishingFromCI
            ? "button-danger"
            : "button-primary"}
          type="submit"
        >
          {scope.requirePublishingFromCI ? "Disable" : "Enable"}{" "}
          requiring publishing from CI
        </button>
      </form>
    </div>
  );
}

interface CardButtonProps {
  title: ComponentChildren;
  description: ComponentChildren;
  selected?: boolean;
  name?: string;
  value?: string;
  type?: "button" | "submit" | "reset";
}

function CardButton(props: CardButtonProps) {
  return (
    <button
      class={`grid text-left rounded-xl p-6 group focus-visible:bg-jsr-yellow-50/30 dark:focus-visible:bg-jsr-yellow-950/30 hover:bg-jsr-yellow-50/30 dark:hover:bg-jsr-yellow-950/30 focus-visible:ring-2 outline-none active:bg-jsr-gray-100 dark:active:bg-jsr-gray-900 ring-2 ${
        props.selected ? "ring-jsr-yellow-400" : "ring-jsr-gray-100/50"
      }`}
      type={props.type}
      name={props.name}
      value={props.value}
    >
      <div class="flex justify-between">
        <p class="text-primary font-semibold leading-none">
          {props.title}
        </p>
        <div
          class={`-mt-2 -mr-2 h-6 w-6 rounded-full flex-shrink-0 flex justify-center items-center group-focus-visible:ring-2 ring-jsr-yellow-700/20 ${
            props.selected
              ? "ring ring-jsr-cyan-950 bg-jsr-cyan-950 text-jsr-yellow"
              : "ring"
          }`}
        >
          {props.selected && <TbCheck class="stroke-2 size-9" />}
        </div>
      </div>
      <p class="mt-2 w-5/6 text-secondary text-sm">{props.description}</p>
    </button>
  );
}

function DeleteScope({ scope }: { scope: FullScope }) {
  const isEmpty = scope.quotas.packageUsage === 0;
  return (
    <form class="mb-8 mt-8" method="POST">
      <h2 class="text-lg font-semibold">Delete scope</h2>
      <p class="mt-2 text-secondary max-w-3xl">
        Deleting the scope will immediately allow other users to claim the scope
        and publish packages to it. This action cannot be undone.
      </p>
      <button
        class="mt-4 button-danger"
        disabled={!isEmpty}
        type="submit"
        name="action"
        value="deleteScope"
      >
        <TbTrash class="size-5" />
        Delete scope
      </button>
      {!isEmpty && (
        <p class="mt-4 text-red-600">
          This scope cannot be deleted because it contains packages. Only empty
          scopes can be deleted.
        </p>
      )}
    </form>
  );
}

export const handler = define.handlers({
  async GET(ctx) {
    const [user, data] = await Promise.all([
      ctx.state.userPromise,
      scopeDataWithMember(ctx.state, ctx.params.scope),
    ]);
    if (user instanceof Response) return user;
    if (data === null) throw new HttpError(404, "The scope was not found.");

    const iam = scopeIAM(ctx.state, data?.scopeMember, user);
    if (!iam.canAdmin) throw new HttpError(404, "The scope was not found.");

    ctx.state.meta = { title: `Settings - @${data.scope.scope} - JSR` };
    return {
      data: {
        scope: data.scope as FullScope,
        iam,
      },
    };
  },
  async POST(ctx) {
    const req = ctx.req;
    const scope = ctx.params.scope;
    const form = await req.formData();
    const action = String(form.get("action"));
    let enableGhActionsVerifyActor = false;
    switch (action) {
      case "enableGhActionsVerifyActor":
        enableGhActionsVerifyActor = true;
        // fallthrough
      case "disableGhActionsVerifyActor": {
        const res = await ctx.state.api.patch(
          path`/scopes/${scope}`,
          { ghActionsVerifyActor: enableGhActionsVerifyActor },
        );
        if (!res.ok) {
          if (res.code === "scopeNotFound") {
            throw new HttpError(404, "The scope was not found.");
          }
          throw res; // graceful handle errors
        }
        return new Response(null, {
          status: 303,
          headers: { Location: `/@${scope}/~/settings` },
        });
      }
      case "requirePublishingFromCI": {
        const value = form.get("value") === "true";
        const res = await ctx.state.api.patch(
          path`/scopes/${scope}`,
          { requirePublishingFromCI: value },
        );
        if (!res.ok) {
          if (res.code === "scopeNotFound") {
            throw new HttpError(404, "The scope was not found.");
          }
          throw res; // graceful handle errors
        }
        return new Response(null, {
          status: 303,
          headers: { Location: `/@${scope}/~/settings` },
        });
      }
      case "deleteScope": {
        const res = await ctx.state.api.delete(path`/scopes/${scope}`);
        if (!res.ok) {
          if (res.code === "scopeNotFound") {
            throw new HttpError(404, "The scope was not found.");
          }
          throw res; // graceful handle errors
        }
        return new Response(null, {
          status: 303,
          headers: { Location: `/` },
        });
      }
      default:
        throw new Error("Invalid action " + action);
    }
  },
});
