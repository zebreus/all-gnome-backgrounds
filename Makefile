.PRECIOUS: gnome-backgrounds
gnome-backgrounds:
	git clone git@ssh.gitlab.gnome.org:GNOME/gnome-backgrounds.git

.PRECIOUS: gnome-backgrounds.rev
gnome-backgrounds.rev: gnome-backgrounds
	git -C gnome-backgrounds rev-parse HEAD | tr -d '\n' > newrev.rev
	if [ "`cat newrev.rev`" != "`cat gnome-backgrounds.rev`" ]; then \
		echo "New revision of gnome-backgrounds"; \
		cp newrev.rev gnome-backgrounds.rev; \
	fi ; \
	rm newrev.rev

.PRECIOUS: results
results: gnome-backgrounds.rev
	bash collect-backgrounds.sh

.PRECIOUS: data
data: results
	mkdir -p data
	mkdir -p data/images
	GLOBIGNORE="*-source*"; cp results/images/* data/images
	cp results/*.json data