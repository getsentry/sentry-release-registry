remove-package-links: 
	rm -f $$(find packages/ -type l)
.PHONY: remove-package-links

sync-all-links: remove-package-links
	bin/sync-links $$(find packages/ sdks/ -type f | grep json)
.PHONY: sync-all-links
