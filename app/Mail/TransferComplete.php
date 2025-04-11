<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TransferComplete extends Mailable
{
    use Queueable, SerializesModels;

    public $transferredItem;

    /**
     * Create a new message instance.
     */
    public function __construct($transferredItem)
    {
        $this->transferredItem = $transferredItem;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Transfer Completed - ' . strip_tags($this->transferredItem->description),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.transfer-complete',
            with: [
                'transferredItem' => $this->transferredItem,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->markdown('emails.transfer-complete')
                    ->subject('Transfer Completed: ' . $this->transferredItem->description)
                    ->with([
                        'transferredItem' => $this->transferredItem,
                    ]);
    }
}
