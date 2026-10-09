import React, { useState } from 'react';
import { Mail, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { Badge, Button, Input } from '../components';

export default function Contact() {
  useDocumentTitle('Contact Campus Support');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Contact Campus Support"
        description="Have questions, partnership inquiries, or suggestions for Campus Classifieds?"
        badge={
          <Badge variant="primary" size="sm">
            Student Support
          </Badge>
        }
      />

      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] p-6 sm:p-8 shadow-2xs space-y-6">
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#F0FDF4] dark:bg-[#14532D]/40 text-[#16A34A] dark:text-[#22C55E] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#FAFAFA]">Message Received</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-sm mx-auto">
              Thank you for reaching out! Our campus student representative will reply to your university email within 24 hours.
            </p>
            <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
              Send Another Note
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Your Name"
                name="name"
                required
                placeholder="Alex Student"
              />
              <Input
                label="Campus Email"
                name="email"
                type="email"
                required
                placeholder="alex@campus.edu"
                leftIcon={Mail}
              />
            </div>

            <Input
              label="Subject"
              name="subject"
              required
              placeholder="e.g. Question about category verification"
            />

            <Input
              label="Message"
              name="message"
              type="textarea"
              rows={4}
              required
              placeholder="How can we help you?"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              leftIcon={Send}
            >
              Send Message
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between text-xs text-[#71717A] dark:text-[#A1A1AA] gap-2">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span>support@campusclassifieds.edu</span>
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span>Student Center Room 204</span>
          </span>
        </div>
      </div>
    </div>
  );
}
