chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "showArchived",
        title: "UnPaywall",
        contexts: ["link"]
    });
    console.log('Context menu item "UnPaywall" created.');
});

chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId === "showArchived") {
        try {
            const url = new URL(info.linkUrl);
            const strippedUrl = url.origin + url.pathname;
            const archiveApiUrl = `https://archive.is/${encodeURIComponent(strippedUrl)}`;

            const response = await fetch(archiveApiUrl);

            if (response.ok) {
                const responseBody = await response.text();
                const linkUrls = extractArchiveLinks(responseBody, strippedUrl);

                if (linkUrls.length > 0) {
                    chrome.tabs.create({ url: linkUrls[0] });
                } else {
                    console.error('Archived link not found in the response.');
                }
            } else {
                console.error('Failed to fetch the archived link. Status:', response.status);
            }
        } catch (error) {
            console.error('Error fetching the archived link:', error);
        }
    }
});

function extractArchiveLinks(responseBody, originalUrl) {
    const urlPattern = /https?:\/\/[^\s]+/g;
    const allUrls = responseBody.match(urlPattern) || [];
    const originalHost = new URL(originalUrl).host.replace('www.', '');

    return allUrls
        .map(link => link.split('">')[0])
        .filter(link =>
            !link.includes(originalHost) &&
            link.includes('https://archive.is') &&
            !link.includes('search/') &&
            !link.endsWith('.gif') &&
            !link.endsWith('.png')
        );
}
