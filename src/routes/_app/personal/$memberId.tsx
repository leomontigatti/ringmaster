import { createFileRoute } from "@tanstack/react-router";

import { activeRecord } from "#/components/admin-form.tsx";
import { useAppForm } from "#/components/app-form.tsx";
import { PageCrumbs } from "#/components/app-breadcrumbs.tsx";
import { pickedIn } from "#/components/form-fields.tsx";
import { fieldProblems, messageIn } from "#/components/form-problems.ts";
import { ActionFormPage, useFormPage } from "#/components/form-page.tsx";
import type { RecordHeader } from "#/components/form-page.tsx";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { DropdownMenuItem } from "#/components/ui/dropdown-menu.tsx";
import { pageHead } from "#/lib/page-title.ts";
import { memberUpdateSchema } from "#/lib/staff.ts";
import type { StaffMember } from "#/organization/staff.ts";
import { changeMemberActive, editMember, getMember } from "#/server/staff.functions.ts";

import { useStartingPasswordDialog } from "#/routes/_app/personal/-starting-password.tsx";
import {
  RefusalAlert,
  roleOptions,
  useAction,
  useEditAction,
} from "#/routes/_app/personal/-shared.tsx";

export const Route = createFileRoute("/_app/personal/$memberId")({
  loader: ({ params }) => getMember({ data: { memberId: params.memberId } }),
  head: ({ loaderData }) => pageHead(loaderData?.ok ? loaderData.member.name : "Persona"),
  staticData: { crumbs: Crumbs },
  component: EditMember,
});

const fieldMessages: Record<string, string> = {
  roles: "Elegí al menos un rol.",
};

/** The form's values; the name and the email show as on `Nueva persona`, but cannot change. */
interface MemberValues {
  roles: string[];
  name: string;
  email: string;
}

function EditMember() {
  const result = Route.useLoaderData();
  if (!result.ok) {
    return <RefusalAlert reason={result.reason} />;
  }
  return <MemberForm member={result.member} />;
}

/**
 * The member's page, as the list opens it: their state beside the name, and
 * `Acciones` with the starting password before the deactivation.
 */
function useMemberRecord(member: StaffMember): RecordHeader {
  const { memberId } = member;
  const toggle = useAction();
  const password = useStartingPasswordDialog(member);
  const record = activeRecord({
    active: member.active,
    ending: "o",
    archived: {
      title: "Persona archivada",
      consequence: "No puede ingresar a ringmaster.",
    },
    transitionId: memberId,
    toggle,
    onChange: (next) =>
      void toggle.run(() => changeMemberActive({ data: { memberId, active: next } })),
    items: <DropdownMenuItem onClick={password.open}>Asignar contraseña inicial</DropdownMenuItem>,
  });
  // The dialog sits beside the menu, which closes on the pick.
  return {
    ...record,
    actions: (busy) => (
      <>
        {record.actions(busy)}
        {password.dialog}
      </>
    ),
  };
}

function MemberForm({ member }: { member: StaffMember }) {
  const { memberId } = member;
  const page = useFormPage({ to: "/personal" });
  const record = useMemberRecord(member);
  const action = useEditAction();
  const defaultValues: MemberValues = {
    roles: pickedIn(roleOptions, member.roles),
    name: member.name,
    email: member.email,
  };
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const parsed = memberUpdateSchema.safeParse({ memberId, roles: value.roles });
      if (!parsed.success) {
        page.showProblems(fieldProblems(parsed.error.issues, messageIn(fieldMessages)));
        return;
      }
      if (await action.save(() => editMember({ data: parsed.data }))) {
        page.leave();
      }
    },
  });

  return (
    <ActionFormPage
      page={page}
      form={form}
      title={member.name}
      description="Los roles de la persona."
      submitLabel="Guardar"
      action={action}
      record={record}
      alerts={
        <Alert variant="info">
          <AlertTitle>El nombre y el correo son los de su cuenta</AlertTitle>
          <AlertDescription>Con ellos ingresa, así que no se cambian desde acá.</AlertDescription>
        </Alert>
      }
    >
      <form.AppField name="name">
        {(field) => <field.TextField label="Nombre" readOnly />}
      </form.AppField>
      <form.AppField name="email">
        {(field) => <field.TextField label="Correo" type="email" size="half" readOnly />}
      </form.AppField>
      <form.AppField name="roles">
        {(field) => <field.CheckboxGroupField legend="Roles" options={roleOptions} />}
      </form.AppField>
    </ActionFormPage>
  );
}

function Crumbs() {
  const result = Route.useLoaderData();
  return <PageCrumbs items={[{ label: result.ok ? result.member.name : "Persona" }]} />;
}
