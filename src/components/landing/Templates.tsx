import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FORM_TEMPLATES } from "@/lib/templates";

export function Templates() {
  return (
    <section id="templates" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Choose from ready-to-use templates
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Create your form in a single click from our curated templates
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FORM_TEMPLATES.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <span className="mb-4 text-4xl">{template.icon}</span>
              <h3 className="mb-2 font-bold">{template.name}</h3>
              <p className="mb-6 flex-1 text-sm text-gray-600">{template.description}</p>
              <Link href={`/signup?template=${template.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Use template
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
