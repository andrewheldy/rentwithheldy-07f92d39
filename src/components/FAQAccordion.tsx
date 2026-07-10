import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

const FAQAccordion = ({ items }: FAQAccordionProps) => (
  <Accordion type="single" collapsible className="w-full">
    {items.map((item, idx) => (
      <AccordionItem key={idx} value={`item-${idx}`}>
        <AccordionTrigger className="text-start text-base font-semibold">
          {item.question}
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground leading-relaxed">
          {item.answer}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export default FAQAccordion;
